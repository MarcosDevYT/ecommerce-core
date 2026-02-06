import { prisma } from "../lib/prisma";
import { HTTPException } from "hono/http-exception";

export class StockService {
  static async getStock(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    return product?.stock || 0;
  }

  static async updateStock(productId: string, quantity: number) {
    return prisma.product.update({
      where: { id: productId },
      data: { stock: quantity },
    });
  }

  /**
   * Validates and decrements stock for multiple items within a transaction
   */
  static async validateAndDecrement(
    tx: any, // Prisma Transaction Client
    items: { productId: string; quantity: number }[],
  ) {
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, name: true },
      });

      if (!product || product.stock < item.quantity) {
        throw new HTTPException(400, {
          message: `Insufficient stock for product ${product?.name || item.productId}`,
        });
      }

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }
  }
}
