import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { CartService } from "../services/cart.service";
import type { Variables } from "../types/hono";

const cartRoutes = new Hono<{ Variables: Variables }>();

// All cart routes require authentication
cartRoutes.use("/*", authMiddleware);

cartRoutes.get("/", async (c) => {
  const user = c.get("user");
  const cart = await CartService.getCart(user.id);
  return c.json(cart);
});

cartRoutes.post(
  "/",
  zValidator(
    "json",
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive().default(1),
    }),
  ),
  async (c) => {
    const user = c.get("user");
    const { productId, quantity } = c.req.valid("json");
    const cart = await CartService.addToCart(user.id, productId, quantity);
    return c.json({ message: "Item added to cart", cart });
  },
);

cartRoutes.put(
  "/:productId",
  zValidator(
    "json",
    z.object({
      quantity: z.number().int().nonnegative(),
    }),
  ),
  async (c) => {
    const user = c.get("user");
    const { productId } = c.req.param();
    const { quantity } = c.req.valid("json");
    const cart = await CartService.updateQuantity(user.id, productId, quantity);
    return c.json({ message: "Cart updated", cart });
  },
);

cartRoutes.delete("/:productId", async (c) => {
  const user = c.get("user");
  const { productId } = c.req.param();
  const cart = await CartService.removeFromCart(user.id, productId);
  return c.json({ message: "Item removed from cart", cart });
});

cartRoutes.delete("/", async (c) => {
  const user = c.get("user");
  await CartService.clearCart(user.id);
  return c.json({ message: "Cart cleared" });
});

export { cartRoutes };
