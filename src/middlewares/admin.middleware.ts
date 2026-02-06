import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { Variables } from "../types/hono";

export const adminMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const user = c.get("user");

    if (!user) {
      // This should ideally strictly follow authMiddleware
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    if (user.role !== "ADMIN") {
      throw new HTTPException(403, { message: "Forbidden: Admins only" });
    }

    await next();
  },
);
