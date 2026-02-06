import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { CategoryService } from "../services/category.service";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const categoryRoutes = new Hono();

// Schemas
const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
});

const updateCategorySchema = z.object({
  name: z.string().optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
});

// Public Routes
categoryRoutes.get("/", async (c) => {
  const categories = await CategoryService.getAll();
  return c.json(categories);
});

categoryRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const category = await CategoryService.getById(id);
  return c.json(category);
});

// Admin Routes (Protected)
categoryRoutes.post(
  "/",
  authMiddleware,
  adminMiddleware,
  zValidator("json", createCategorySchema),
  async (c) => {
    const data = c.req.valid("json");
    const category = await CategoryService.create(data);
    return c.json(category, 201);
  },
);

categoryRoutes.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  zValidator("json", updateCategorySchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const category = await CategoryService.update(id, data);
    return c.json(category);
  },
);

categoryRoutes.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = c.req.param("id");
  await CategoryService.delete(id);
  return c.json({ message: "Category deleted" });
});

export { categoryRoutes };
