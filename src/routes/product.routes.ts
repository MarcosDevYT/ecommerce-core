import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { ProductService } from "../services/product.service";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { AnalyticsService } from "../services/analytics.service";

const productRoutes = new Hono();

// Schemas
const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string(),
  price: z.number().positive(),
  categoryId: z.string().uuid(),
  images: z.array(z.string().url()).optional(),
  stock: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

const updateProductSchema = createProductSchema.partial();

const querySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

// Public Routes
productRoutes.get("/", zValidator("query", querySchema), async (c) => {
  const query = c.req.valid("query");
  const result = await ProductService.getAll({
    ...query,
    isActive:
      query.isActive === "true"
        ? true
        : query.isActive === "false"
          ? false
          : undefined,
  });
  return c.json(result);
});

productRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const product = await ProductService.getBySlug(slug);
  // Background track view
  const user = c.get("user" as any);
  AnalyticsService.trackProductView(product.id, user?.id).catch(() => {});
  return c.json(product);
});

// Admin Routes
productRoutes.post(
  "/",
  authMiddleware,
  adminMiddleware,
  zValidator("json", createProductSchema),
  async (c) => {
    const data = c.req.valid("json");
    const product = await ProductService.create(data);
    return c.json(product, 201);
  },
);

productRoutes.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  zValidator("json", updateProductSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const product = await ProductService.update(id, data);
    return c.json(product);
  },
);

productRoutes.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await ProductService.delete(id);
  return c.json({ message: "Product deleted" });
});

export { productRoutes };
