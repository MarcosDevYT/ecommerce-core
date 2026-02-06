import { prisma } from "../lib/prisma";
import { CartService } from "./cart.service";
import { StockService } from "./stock.service";
import { HTTPException } from "hono/http-exception";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { AnalyticsService } from "./analytics.service";

export class OrderService {
  static async createFromCart(userId: string) {
    const cartItems = await CartService.getCart(userId);

    if (cartItems.length === 0) {
      throw new HTTPException(400, { message: "Cart is empty" });
    }

    // Start transaction
    return await prisma.$transaction(async (tx) => {
      // 1. Validate and decrement stock
      await StockService.validateAndDecrement(
        tx,
        cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      );

      // 2. Calculate actual total from DB prices (to prevent client-side price manipulation)
      let total = 0;
      const orderItemsData = [];

      for (const item of cartItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { price: true },
        });

        if (!product) {
          throw new HTTPException(404, {
            message: `Product ${item.productId} not found`,
          });
        }

        const price = Number(product.price);
        total += price * item.quantity;

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: price,
        });
      }

      // 3. Create the Order
      const order = await tx.order.create({
        data: {
          userId,
          total,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // 4. Clear the cart
      await CartService.clearCart(userId);

      await AnalyticsService.trackEvent("ORDER_CREATED", {
        orderId: order.id,
        total: order.total,
      });

      return order;
    });
  }

  static async getMyOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, images: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getOrderById(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new HTTPException(404, { message: "Order not found" });
    }

    if (order.userId !== userId) {
      throw new HTTPException(403, { message: "Unauthorized" });
    }

    return order;
  }

  static async markAsPaid(orderId: string, stripeSessionId: string) {
    return await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.COMPLETED,
        stripeSessionId,
      },
      include: {
        user: true,
      },
    });
  }
}
