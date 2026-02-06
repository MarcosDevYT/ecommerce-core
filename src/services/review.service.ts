import { prisma } from "../lib/prisma";
import { HTTPException } from "hono/http-exception";

export class ReviewService {
  static async create(
    userId: string,
    productId: string,
    data: { rating: number; comment?: string },
  ) {
    if (data.rating < 1 || data.rating > 5) {
      throw new HTTPException(400, {
        message: "Rating must be between 1 and 5",
      });
    }

    // Optional: Check if user has purchased the product
    // const hasPurchased = await prisma.order.findFirst({
    //   where: { userId, status: 'DELIVERED', items: { some: { productId } } }
    // });
    // if (!hasPurchased) throw new HTTPException(403, { message: "Only customers who purchased this product can review it" });

    return await prisma.review.create({
      data: {
        userId,
        productId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  }

  static async getByProduct(productId: string) {
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      reviews,
      averageRating,
      count: reviews.length,
    };
  }

  static async delete(reviewId: string, userId: string, isAdmin: boolean) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new HTTPException(404, { message: "Review not found" });
    }

    if (review.userId !== userId && !isAdmin) {
      throw new HTTPException(403, {
        message: "Unauthorized to delete this review",
      });
    }

    return await prisma.review.delete({
      where: { id: reviewId },
    });
  }
}
