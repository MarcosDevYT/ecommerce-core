import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";

import { authRoutes } from "./src/routes/auth.routes";
import { categoryRoutes } from "./src/routes/category.routes";
import { productRoutes } from "./src/routes/product.routes";
import { cartRoutes } from "./src/routes/cart.routes";
import { orderRoutes } from "./src/routes/order.routes";
import { paymentRoutes } from "./src/routes/payment.routes";
import { reviewRoutes } from "./src/routes/review.routes";
import { globalErrorHandler } from "./src/middlewares/error.handler.ts";
import { rateLimiter } from "./src/middlewares/rate-limiter.middleware.ts";
import { prisma } from "./src/lib/prisma";
import { redis } from "./src/lib/redis";

const app = new Hono();

// Middlewares
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", cors());

// Global Error Handling
app.onError(globalErrorHandler);

// Global 404
app.notFound((c) =>
  c.json(
    {
      success: false,
      error: "Not Found",
      message: `Route ${c.req.path} not found`,
    },
    404,
  ),
);

// Routes
// Apply rate limit specifically to sensitive routes
app.use("/api/auth/*", rateLimiter(10, 60)); // 10 reqs per minute for auth
app.use("/api/payments/create-session", rateLimiter(5, 60)); // 5 reqs per minute for payments

app.route("/api/auth", authRoutes);
app.route("/api/categories", categoryRoutes);
app.route("/api/products", productRoutes);
app.route("/api/cart", cartRoutes);
app.route("/api/orders", orderRoutes);
app.route("/api/payments", paymentRoutes);
app.route("/api", reviewRoutes);

// Health check
app.get("/api/health", async (c) => {
  const dbStatus = await prisma.$queryRaw`SELECT 1`
    .then(() => "CONNECTED")
    .catch(() => "DISCONNECTED");
  const redisStatus = await redis
    .ping()
    .then(() => "CONNECTED")
    .catch(() => "DISCONNECTED");

  const status =
    dbStatus === "CONNECTED" && redisStatus === "CONNECTED" ? 200 : 503;

  return c.json(
    {
      status: status === 200 ? "OK" : "DEGRADED",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    },
    status,
  );
});

const port = 8080;

console.log(`Server is running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
