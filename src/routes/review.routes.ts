import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ReviewService } from "../services/review.service";

const reviewRoutes = new Hono();

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// POST /api/products/:id/reviews - Create a review
reviewRoutes.post(
  "/products/:id/reviews",
  authMiddleware,
  zValidator("json", reviewSchema),
  async (c) => {
    const userId = c.get("user").id;
    const productId = c.req.param("id");
    const data = c.req.valid("json");

    const review = await ReviewService.create(userId, productId, data);
    return c.json(review, 201);
  },
);

// GET /api/products/:id/reviews - Get reviews for a product
reviewRoutes.get("/products/:id/reviews", async (c) => {
  const productId = c.req.param("id");
  const result = await ReviewService.getByProduct(productId);
  return c.json(result);
});

// DELETE /api/reviews/:id - Delete a review
reviewRoutes.delete("/reviews/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const reviewId = c.req.param("id");

  await ReviewService.delete(reviewId, user.id, user.role === "ADMIN");
  return c.json({ message: "Review deleted" });
});

export { reviewRoutes };
