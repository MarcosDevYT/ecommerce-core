import { prisma } from "../lib/prisma";
import { HTTPException } from "hono/http-exception";

export class CategoryService {
  static async getAll() {
    return prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  static async getById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!category) {
      throw new HTTPException(404, { message: "Category not found" });
    }

    return category;
  }

  static async create(data: { name: string; slug: string }) {
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new HTTPException(400, { message: "Slug already exists" });
    }

    return prisma.category.create({
      data,
    });
  }

  static async update(id: string, data: { name?: string; slug?: string }) {
    // Check if exists
    await this.getById(id);

    if (data.slug) {
      const existing = await prisma.category.findUnique({
        where: { slug: data.slug },
      });
      if (existing && existing.id !== id) {
        throw new HTTPException(400, { message: "Slug already in use" });
      }
    }

    return prisma.category.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    await this.getById(id);

    return prisma.category.delete({
      where: { id },
    });
  }
}
