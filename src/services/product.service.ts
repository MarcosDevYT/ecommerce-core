import { prisma } from "../lib/prisma";
import { HTTPException } from "hono/http-exception";
import { Prisma } from "@prisma/client";

export class ProductService {
  static async getAll(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    isActive?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: { name: true, slug: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new HTTPException(404, { message: "Product not found" });
    }

    return product;
  }

  static async create(data: {
    name: string;
    slug: string;
    description: string;
    price: number;
    categoryId: string;
    images?: string[];
    stock?: number;
  }) {
    // Check slug uniqueness
    const existing = await prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new HTTPException(400, { message: "Product slug already exists" });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new HTTPException(400, { message: "Invalid Category ID" });
    }

    return await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        images: data.images || [],
        stock: data.stock || 0,
      },
      include: {
        category: true,
      },
    });
  }

  static async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      price?: number;
      categoryId?: string;
      images?: string[];
      stock?: number;
      isActive?: boolean;
    },
  ) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new HTTPException(404, { message: "Product not found" });
    }

    if (data.slug) {
      const existing = await prisma.product.findUnique({
        where: { slug: data.slug },
      });
      if (existing && existing.id !== id) {
        throw new HTTPException(400, { message: "Slug already in use" });
      }
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new HTTPException(400, { message: "Invalid Category ID" });
      }
    }

    return prisma.product.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    // Ensure product exists
    await prisma.product.findUniqueOrThrow({ where: { id } }).catch(() => {
      throw new HTTPException(404, { message: "Product not found" });
    });

    return prisma.product.delete({
      where: { id },
    });
  }
}
