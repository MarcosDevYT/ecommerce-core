import { HTTPException } from "hono/http-exception";
import type { ErrorHandler } from "hono";

export const globalErrorHandler: ErrorHandler = async (err, c) => {
  console.error(`[Error] ${c.req.method} ${c.req.url}:`, err);

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  // Handle Prisma errors specifically if needed
  if (err.name === "PrismaClientKnownRequestError") {
    return c.json(
      {
        success: false,
        error: "Database operation failed",
        code: (err as any).code,
        message: "A database constraint was violated.",
      },
      400,
    );
  }

  // Default internal server error
  const status = 500;
  return c.json(
    {
      success: false,
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong. Please try again later."
          : err.message,
    },
    status,
  );
};
