import { prisma } from "../lib/prisma";
import { hashPassword, comparePassword } from "../utils/password";
import { sign } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import { AnalyticsService } from "./analytics.service";
import { EmailService } from "./email.service";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretShouldBeInEnv";

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    name?: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new HTTPException(400, { message: "User already exists" });
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    await AnalyticsService.trackEvent("USER_REGISTERED", {
      userId: user.id,
      email: user.email,
    });

    return user;
  }

  static async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.password) {
      throw new HTTPException(401, { message: "Invalid credentials" });
    }

    const isValid = await comparePassword(data.password, user.password);

    if (!isValid) {
      throw new HTTPException(401, { message: "Invalid credentials" });
    }

    const token = await sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      },
      JWT_SECRET,
    );

    await AnalyticsService.trackEvent("USER_LOGIN", { userId: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  static async loginWithGoogle(idToken: string) {
    const { OAuth2Client } = await import("google-auth-library");
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new HTTPException(400, { message: "Invalid Google Token" });
    }

    const { email, name, picture } = payload;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || "Google User",
          image: picture,
          password: null, // No password for OAuth users
        },
      });
    }

    const token = await sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      },
      JWT_SECRET,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
      token,
    };
  }

  static async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
      },
    });

    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }

    return user;
  }

  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return {
        message:
          "Si el correo está registrado, recibirás un enlace de recuperación.",
      };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        expiresAt,
        userId: user.id,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await EmailService.sendPasswordReset(
      user.email,
      user.name || "Usuario",
      resetUrl,
    );

    return { message: "Correo de recuperación enviado." };
  }

  static async resetPassword(token: string, newPassword: string) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new HTTPException(400, {
        message: "El token es inválido o ha expirado.",
      });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    await AnalyticsService.trackEvent("PASSWORD_RESET_SUCCESS", {
      userId: resetToken.userId,
    });

    return { message: "Contraseña actualizada con éxito." };
  }
}
