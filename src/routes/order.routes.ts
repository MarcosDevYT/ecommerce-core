import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware";
import { OrderService } from "../services/order.service";
import type { Variables } from "../types/hono";

const orderRoutes = new Hono<{ Variables: Variables }>();

orderRoutes.use("/*", authMiddleware);

// Create order from current cart
orderRoutes.post("/", async (c) => {
  const user = c.get("user");
  const order = await OrderService.createFromCart(user.id);
  return c.json({ message: "Order created successfully", order }, 201);
});

// Get user's order history
orderRoutes.get("/", async (c) => {
  const user = c.get("user");
  const orders = await OrderService.getMyOrders(user.id);
  return c.json(orders);
});

// Get specific order details
orderRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const { id } = c.req.param();
  const order = await OrderService.getOrderById(id, user.id);
  return c.json(order);
});

export { orderRoutes };
