import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { AuthService } from "../services/auth.service";
import { authMiddleware } from "../middlewares/auth.middleware";
import { prisma } from "../lib/prisma";
import type { Variables } from "../types/hono";

const authRoutes = new Hono<{ Variables: Variables }>();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const data = c.req.valid("json");
  try {
    const user = await AuthService.register(data);
    return c.json(user, 201);
  } catch (error: any) {
    // If it's a known HTTP exception, rethrow or handle explicitly
    if (error.status) throw error;
    return c.json({ error: error.message || "Registration failed" }, 400);
  }
});

authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const data = c.req.valid("json");
  try {
    const result = await AuthService.login(data);
    return c.json(result);
  } catch (error: any) {
    if (error.status) throw error;
    return c.json({ error: error.message || "Login failed" }, 401);
  }
});

authRoutes.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const userData = await AuthService.me(user.id);
  return c.json(userData);
});

// Request Password Reset
authRoutes.post(
  "/request-reset",
  zValidator("json", z.object({ email: z.string().email() })),
  async (c) => {
    const { email } = c.req.valid("json");
    const result = await AuthService.requestPasswordReset(email);
    return c.json(result);
  },
);

// Reset Password
authRoutes.post(
  "/reset-password",
  zValidator(
    "json",
    z.object({ token: z.string(), password: z.string().min(6) }),
  ),
  async (c) => {
    const { token, password } = c.req.valid("json");
    const result = await AuthService.resetPassword(token, password);
    return c.json(result);
  },
);

authRoutes.post(
  "/google",
  zValidator("json", z.object({ token: z.string() })),
  async (c) => {
    const { token } = c.req.valid("json");
    try {
      const result = await AuthService.loginWithGoogle(token);
      return c.json(result);
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      return c.json({ error: "Google Authentication failed" }, 401);
    }
  },
);

// System Route: Change User Role (Protected by ADMIN_SECRET_KEY)
authRoutes.patch(
  "/role",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      role: z.enum(["ADMIN", "USER"]),
    }),
  ),
  async (c) => {
    const secret = c.req.header("x-admin-secret");

    if (
      !process.env.ADMIN_SECRET_KEY ||
      secret !== process.env.ADMIN_SECRET_KEY
    ) {
      return c.json({ error: "Unauthorized: Invalid Secret Key" }, 403);
    }

    const { email, role } = c.req.valid("json");

    try {
      const user = await prisma.user.update({
        where: { email },
        data: { role },
        select: { id: true, email: true, role: true },
      });
      return c.json({ message: `User ${email} is now ${role}`, user });
    } catch (error) {
      return c.json({ error: "User not found" }, 404);
    }
  },
);

export { authRoutes };
