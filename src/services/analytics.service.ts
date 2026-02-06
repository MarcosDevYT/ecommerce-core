import { prisma } from "../lib/prisma";

export class AnalyticsService {
  /**
   * Track general system events
   */
  static async trackEvent(event: string, payload: any = {}) {
    try {
      await prisma.analytics.create({
        data: {
          event,
          payload,
        },
      });
    } catch (error) {
      console.error(`[Analytics Error] Failed to track event ${event}:`, error);
      // We don't throw here to avoid breaking the main request flow
    }
  }

  /**
   * Track Product views (for conversion rates)
   */
  static async trackProductView(productId: string, userId?: string) {
    return this.trackEvent("PRODUCT_VIEW", { productId, userId });
  }

  /**
   * Track search queries
   */
  static async trackSearch(query: string, userId?: string) {
    if (!query) return;
    return this.trackEvent("SEARCH_QUERY", { query, userId });
  }

  /**
   * Track abandoned carts (called when a user doesn't complete checkout)
   */
  static async trackAbandonedCart(userId: string, cartItems: any[]) {
    return this.trackEvent("ABANDONED_CART", {
      userId,
      itemsCount: cartItems.length,
    });
  }
}
