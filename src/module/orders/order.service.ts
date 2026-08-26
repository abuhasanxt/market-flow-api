import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { envVars } from "../../config/env";

// pay now order
const createOrder = async (userId: string) => {
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        //  Get user's cart with products
        const cart = await tx.cart.findUnique({
          where: {
            userId,
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        //  Cart check
        if (!cart) {
          throw new AppError(status.NOT_FOUND, "Cart not found");
        }

        //  Empty cart check
        if (cart.items.length === 0) {
          throw new AppError(status.BAD_REQUEST, "Cart is empty");
        }

        // vendorId cart items group
        const vendorGroups = new Map<
          string,
          {
            vendorId: string;
            items: {
              productId: string;
              name: string;
              price: number;
              quantity: number;
            }[];
            subtotal: number;
          }
        >();

        let totalAmount = 0;

        //  Process cart items
        for (const item of cart.items) {
          const product = item.product;

          // Product active check
          if (!product.isActive) {
            throw new AppError(
              status.BAD_REQUEST,
              `${product.name} is not active`,
            );
          }

          // Quantity validation
          if (item.quantity <= 0) {
            throw new AppError(
              status.BAD_REQUEST,
              `Invalid quantity for ${product.name}`,
            );
          }

          //  Atomic stock decrement
          const updatedStock = await tx.product.updateMany({
            where: {
              id: product.id,
              isActive: true,
              stock: {
                gte: item.quantity,
              },
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          if (updatedStock.count === 0) {
            throw new AppError(
              status.BAD_REQUEST,
              `Insufficient stock for ${product.name}`,
            );
          }

          //  Item total
          const itemTotal = product.price * item.quantity;

          totalAmount += itemTotal;

          //  Group by vendor
          const vendorId = product.vendorId;

          if (!vendorGroups.has(vendorId)) {
            vendorGroups.set(vendorId, {
              vendorId,
              items: [],
              subtotal: 0,
            });
          }

          const vendorGroup = vendorGroups.get(vendorId)!;

          vendorGroup.items.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
          });

          vendorGroup.subtotal += itemTotal;
        }

        //  Create main Order
        const order = await tx.order.create({
          data: {
            userId,
            totalAmount,
            status: "PENDING",
          },
        });

        //  Create SubOrders
        for (const vendorGroup of vendorGroups.values()) {
          const subtotal = vendorGroup.subtotal;

          // platform commission
          const commissionAmount =
            Math.floor(subtotal * envVars.PLATFORM_COMMISSION_RATE) / 100;

          const vendorEarning = subtotal - commissionAmount;

          //  Create SubOrder
          const subOrder = await tx.subOrder.create({
            data: {
              orderId: order.id,
              vendorId: vendorGroup.vendorId,
              subtotal,
              commissionAmount,
              vendorEarning,
              status: "PENDING",
              payoutStatus: "PENDING",
            },
          });

          //  Create OrderItems
          await tx.orderItem.createMany({
            data: vendorGroup.items.map((item) => ({
              subOrderId: subOrder.id,
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
          });
        }

        //  Clear cart
        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
          },
        });

        //  Return complete order
        return await tx.order.findUnique({
          where: {
            id: order.id,
          },
          include: {
            subOrders: {
              include: {
                vendor: true,
                items: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 15000,
      },
    );

    return result;
  } catch (error) {
    console.log("CREATE ORDER ERROR: ", error);
  }
};

export const orderService = {
  createOrder,
};
