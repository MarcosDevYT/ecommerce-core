import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { redis } from "../lib/redis";

/**
 * Basic Redis-based Rate Limiter
 * @param limit Max requests
 * @param windowSeconds Time window in seconds
 */
export const rateLimiter = (limit: number, windowSeconds: number) => {
  return createMiddleware(async (c, next) => {
    const ip = c.req.header("x-forwarded-for") || "anonymous";
    const key = `rate-limit:${c.req.path}:${ip}`;

    try {
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (current > limit) {
        throw new HTTPException(429, {
          message: "Too many requests. Please try again later.",
        });
      }

      await next();
    } catch (error) {
      if (error instanceof HTTPException) throw error;

      // If Redis fails, we allow the request but log it
      console.error("[Rate Limiter] Redis Error:", error);
      await next();
    }
  });
};
