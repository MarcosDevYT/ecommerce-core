import { redis } from "../lib/redis";
import { prisma } from "../lib/prisma";

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartWithDetails extends CartItem {
  name: string;
  price: number;
  image?: string;
}

export class CartService {
  private static getCartKey(userId: string) {
    return `cart:${userId}`;
  }

  static async getCart(userId: string): Promise<CartWithDetails[]> {
    const cartData = await redis.get(this.getCartKey(userId));
    if (!cartData) return [];

    const items: CartItem[] = JSON.parse(cartData);

    // Fetch product details for all items in the cart
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
      },
    });

    // Map details back to cart items
    return items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        ...item,
        name: product?.name || "Unknown Product",
        price: Number(product?.price || 0),
        image: product?.images[0],
      };
    });
  }

  static async addToCart(userId: string, productId: string, quantity: number) {
    const cartData = await redis.get(this.getCartKey(userId));
    let cart: CartItem[] = cartData ? JSON.parse(cartData) : [];

    const existingItemIndex = cart.findIndex((i) => i.productId === productId);

    if (existingItemIndex > -1) {
      const existingItem = cart[existingItemIndex];
      if (existingItem) {
        existingItem.quantity += quantity;
      }
    } else {
      cart.push({ productId, quantity });
    }

    await redis.set(
      this.getCartKey(userId),
      JSON.stringify(cart),
      "EX",
      60 * 60 * 24 * 7,
    ); // 7 days
    return this.getCart(userId);
  }

  static async updateQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ) {
    const cartData = await redis.get(this.getCartKey(userId));
    if (!cartData) return [];

    let cart: CartItem[] = JSON.parse(cartData);
    const itemIndex = cart.findIndex((i) => i.productId === productId);

    if (itemIndex > -1) {
      const item = cart[itemIndex];
      if (item) {
        if (quantity <= 0) {
          cart.splice(itemIndex, 1);
        } else {
          item.quantity = quantity;
        }
        await redis.set(
          this.getCartKey(userId),
          JSON.stringify(cart),
          "EX",
          60 * 60 * 24 * 7,
        );
      }
    }

    return this.getCart(userId);
  }

  static async removeFromCart(userId: string, productId: string) {
    const cartData = await redis.get(this.getCartKey(userId));
    if (!cartData) return [];

    let cart: CartItem[] = JSON.parse(cartData);
    const updatedCart = cart.filter((i) => i.productId !== productId);

    await redis.set(
      this.getCartKey(userId),
      JSON.stringify(updatedCart),
      "EX",
      60 * 60 * 24 * 7,
    );
    return this.getCart(userId);
  }

  static async clearCart(userId: string) {
    await redis.del(this.getCartKey(userId));
  }
}
