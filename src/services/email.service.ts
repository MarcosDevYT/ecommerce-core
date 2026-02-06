import nodemailer from "nodemailer";
import { Resend } from "resend";
import {
  getOrderConfirmationTemplate,
  getPasswordResetTemplate,
} from "../utils/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

// Configuración de Nodemailer (para pruebas con Mailtrap, Ethereal o SMTP local)
const transporter = nodemailer.createTransport(
  process.env.EMAIL_SERVICE
    ? {
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      }
    : {
        host: process.env.SMTP_HOST || "smtp.ethereal.email",
        port: parseInt(process.env.SMTP_PORT || "587"),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
);

export class EmailService {
  private static useNodemailer = process.env.USE_NODEMAILER === "true";
  private static fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

  static async sendOrderConfirmation(to: string, userName: string, order: any) {
    const html = getOrderConfirmationTemplate(order, userName);
    const subject = `Confirmación de Orden #${order.id.slice(0, 8)}`;

    return this.sendEmail(to, subject, html);
  }

  static async sendPasswordReset(
    to: string,
    userName: string,
    resetUrl: string,
  ) {
    const html = getPasswordResetTemplate(resetUrl, userName);
    const subject = "Restablecer tu contraseña";

    return this.sendEmail(to, subject, html);
  }

  private static async sendEmail(to: string, subject: string, html: string) {
    if (this.useNodemailer) {
      console.log(`[EmailService] Sending via Nodemailer to ${to}`);
      const info = await transporter.sendMail({
        from: `"Ecommerce Core" <${this.fromEmail}>`,
        to,
        subject,
        html,
      });
      console.log(
        "[EmailService] Nodemailer info:",
        nodemailer.getTestMessageUrl(info) || info.messageId,
      );
      return info;
    } else {
      console.log(`[EmailService] Sending via Resend to ${to}`);
      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      if (error) {
        console.error("[EmailService] Resend Error:", error);
        throw new Error(`Failed to send email via Resend: ${error.message}`);
      }

      return data;
    }
  }
}
