import Stripe from "stripe";
import { HTTPException } from "hono/http-exception";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover" as any, // Using 'as any' if it's too new or satisfying the exact literal
});

export class StripeService {
  /**
   * Creates a Checkout Session for an order
   */
  static async createCheckoutSession(params: {
    orderId: string;
    items: {
      name: string;
      price: number;
      quantity: number;
      images?: string[];
    }[];
    customerEmail: string;
  }) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new HTTPException(500, {
        message: "Stripe Secret Key is not configured",
      });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: params.items.map((item) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
              images: item.images,
            },
            unit_amount: Math.round(item.price * 100), // Stripe uses cents
          },
          quantity: item.quantity,
        })),
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
        customer_email: params.customerEmail,
        metadata: {
          orderId: params.orderId,
        },
      });

      return session;
    } catch (error: any) {
      console.error("Stripe Checkout Error:", error);
      throw new HTTPException(400, {
        message: error.message || "Failed to create Stripe session",
      });
    }
  }

  /**
   * Verifies and constructs Stripe Webhook Event
   */
  static constructEvent(payload: string | Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new HTTPException(500, {
        message: "Stripe Webhook Secret is not configured",
      });
    }

    try {
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error: any) {
      console.error("Webhook Verification Error:", error.message);
      throw new HTTPException(400, {
        message: `Webhook Error: ${error.message}`,
      });
    }
  }
}
