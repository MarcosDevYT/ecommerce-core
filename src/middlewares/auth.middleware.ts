import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import type { Variables } from "../types/hono";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretShouldBeInEnv";

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  [key: string]: unknown; // Allow other standard JWT claims
}

export const authMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1] as string;

    try {
      // Cast the result of verify to our known payload type
      const payload = (await verify(
        token,
        JWT_SECRET,
        "HS256",
      )) as unknown as JWTPayload;
      c.set("jwtPayload", payload);

      // Explicitly map to ensure type safety and remove JWT metadata like 'exp'
      c.set("user", {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      });

      await next();
    } catch (error) {
      throw new HTTPException(401, { message: "Invalid token" });
    }
  },
);
