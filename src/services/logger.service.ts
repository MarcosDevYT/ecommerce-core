import { prisma } from "../lib/prisma";

export class LoggerService {
  /**
   * Log incoming webhooks (Stripe, etc.) for auditing
   */
  static async logWebhook(source: string, payload: any, status: number) {
    try {
      return await prisma.webhookLog.create({
        data: {
          source,
          payload,
          status,
        },
      });
    } catch (error) {
      console.error(
        `[Logger Error] Failed to log webhook from ${source}:`,
        error,
      );
    }
  }
}
