import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

const addToCart = async (
  userId: string,
  items: {
    productId: string;
    quantity: number;
  }[],
) => {
  // Cart create/find
  const cart = await prisma.cart.upsert({
    where: {
      userId,
    },
    update: {},
    create: {
      userId,
    },
  });

  const results = [];

  for (const item of items) {
    const { productId, quantity } = item;

    // Product check
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new AppError(status.NOT_FOUND, `Product ${productId} not found`);
    }

    // Product active check
    if (!product.isActive) {
      throw new AppError(status.BAD_REQUEST, `${product.name} is not active`);
    }

    // Stock check
    if (product.stock < quantity) {
      throw new AppError(
        status.BAD_REQUEST,
        `Insufficient stock for ${product.name}`,
      );
    }

    // Existing cart item check
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    // If product already exists in cart
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        throw new AppError(
          status.BAD_REQUEST,
          `Requested quantity exceeds available stock for ${product.name}`,
        );
      }

      const updatedItem = await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: newQuantity,
        },
      });

      results.push(updatedItem);
    } else {
      // New cart item
      const newItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });

      results.push(newItem);
    }
  }

  return results;
};

const getCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({
    where: {
      userId
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
  if (!cart) {
    throw new AppError(status.NOT_FOUND, `Cart for user  not found`);
  }

  return cart;
};
export const cartService={
  addToCart,
  getCart
}
