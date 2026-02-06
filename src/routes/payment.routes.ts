import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware";
import { OrderService } from "../services/order.service";
import { StripeService } from "../services/stripe.service";
import { EmailService } from "../services/email.service";
import { LoggerService } from "../services/logger.service";
import { HTTPException } from "hono/http-exception";

const paymentRoutes = new Hono();

/**
 * POST /api/payments/create-session/:orderId
 * Protected: Create a Stripe Checkout Session for an order
 */
paymentRoutes.post("/create-session/:orderId", authMiddleware, async (c) => {
  const user = c.get("user");
  const orderId = c.req.param("orderId");

  const order = await OrderService.getOrderById(orderId, user.id);

  if (order.status !== "PENDING") {
    throw new HTTPException(400, {
      message: "Order is already processed or cancelled",
    });
  }

  const items = order.items.map((item: any) => ({
    name: item.product.name,
    price: Number(item.price),
    quantity: item.quantity,
    images: item.product.images,
  }));

  const session = await StripeService.createCheckoutSession({
    orderId: order.id,
    items,
    customerEmail: user.email,
  });

  return c.json({
    url: session.url,
    sessionId: session.id,
  });
});

/**
 * POST /api/payments/webhook
 * Public: Stripe Webhook handler
 */
paymentRoutes.post("/webhook", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!signature) {
    throw new HTTPException(400, {
      message: "Missing stripe-signature header",
    });
  }

  // Stripe webhooks need the RAW body for signature verification
  const body = await c.req.raw.text();

  try {
    const event = StripeService.constructEvent(body, signature);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        const order = await OrderService.markAsPaid(orderId, session.id);

        // Enviar correo de confirmación
        if (order.user) {
          await EmailService.sendOrderConfirmation(
            order.user.email,
            order.user.name || "Cliente",
            order,
          ).catch((err) =>
            console.error("Error sending order confirmation email:", err),
          );
        }
      }
      await LoggerService.logWebhook("STRIPE", event, 200);
    }

    return c.json({ received: true });
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    await LoggerService.logWebhook("STRIPE", { error: error.message }, 400);
    throw new HTTPException(400, { message: "Webhook Error" });
  }
});

export { paymentRoutes };
