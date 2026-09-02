import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { envVars } from "../../config/env";
import {
  OrderStatus,
  PaymentStatus,
  PayoutStatus,
  Role,
  SubOrderStatus,
} from "../../../generated/prisma/enums";
import { randomUUID } from "node:crypto";
import { stripe } from "../../config/stripe.config";

// pay now order
const createOrder = async (userId: string) => {
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
          status: OrderStatus.PENDING,
        },
      });
      console.log("Order create", order.id);

      //  Create Payment
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          currency: "bdt",
          status: PaymentStatus.UNPAID,
          transactionId: randomUUID(),
        },
      });
      console.log("🚀 ~ createOrder ~ payment:", payment);

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
      console.log("card cleared", cart.id);
      //  Return complete order
      const completeOrder = await tx.order.findUnique({
        where: {
          id: order.id,
        },
        include: {
          payment: true,
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

      if (!completeOrder) {
        throw new AppError(
          status.INTERNAL_SERVER_ERROR,
          "Failed to retrieve created order",
        );
      }

      return {
        order: completeOrder,
        payment,
      };
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "bdt",

            product_data: {
              name: `Order #${result.order.id}`,
            },

            // Stripe smallest currency unit
            unit_amount: result.order.totalAmount * 100,
          },

          quantity: 1,
        },
      ],

      // Webhook will use these values
      metadata: {
        orderId: result.order.id,

        paymentId: result.payment.id,
      },
      success_url:
        `${envVars.FRONTEND_URL}` +
        `/dashboard/payment/payment-success` +
        `?order_id=${result.order.id}` +
        `&payment_id=${result.payment.id}`,

      cancel_url:
        `${envVars.FRONTEND_URL}` + `/dashboard/order?payment=cancelled`,
    });

    console.log("✅ Stripe Checkout Session created:", session.id);
  } catch (error) {
    console.error("Stripe session creation failed:", error);
    // Stripe session failed
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: {
          id: result.order.id,
        },

        data: {
          status: OrderStatus.CANCELLED,
        },
      });

      await tx.payment.delete({
        where: {
          id: result.payment.id,
        },
      });

      for (const subOrder of result.order.subOrders) {
        for (const item of subOrder.items) {
          await tx.product.update({
            where: {
              id: item.productId,
            },

            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }
    });

    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Failed to create Stripe payment session",
    );
  }

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;

  const paymentData = await prisma.payment.update({
    where: {
      id: result.payment.id,
    },
    data: {
      paymentIntentId,
    },
  });
  return {
    result,
    paymentData,
    paymentUrl: session.url,
  };
};
const getAllOrder = async (userId: string, role: Role) => {
  const result = await prisma.order.findMany({
    where:
      role === Role.ADMIN
        ? {}
        : {
            userId,
          },

    include: {
      subOrders: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  if (result.length === 0) {
    throw new AppError(status.NOT_FOUND, "No orders found");
  }

  return result;
};

const getOrderById = async (userId: string, role: Role, id: string) => {
  const result = await prisma.order.findFirst({
    where: {
      id,
      ...(role !== Role.ADMIN && {
        userId,
      }),
    },

    include: {
      subOrders: {
        include: {
          items: true,
          vendor: true,
        },
      },
    },
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, "Order not found");
  }

  return result;
};

const orderWithPayLater = async (userId: string) => {
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Get user's cart with products
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

        // Cart check
        if (!cart) {
          throw new AppError(status.NOT_FOUND, "Cart not found");
        }

        // Empty cart check
        if (cart.items.length === 0) {
          throw new AppError(status.BAD_REQUEST, "Cart is empty");
        }

        // Vendor grouping
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

        // Process cart items
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

          // Atomic stock decrement
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

          // Item total
          const itemTotal = product.price * item.quantity;

          totalAmount += itemTotal;

          // Group by vendor
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

        // Create main order
        const order = await tx.order.create({
          data: {
            userId,
            totalAmount,
            status: OrderStatus.PENDING,
          },
        });

        // Create Pay Later payment
        const transactionId = randomUUID();

        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: totalAmount,
            currency: "bdt",
            status: PaymentStatus.UNPAID,
            transactionId,
            paymentIntentId: `paylater-${transactionId}`,
          },
        });

        // Create SubOrders
        for (const vendorGroup of vendorGroups.values()) {
          const subtotal = vendorGroup.subtotal;

          // Platform commission
          const commissionAmount =
            Math.floor(subtotal * envVars.PLATFORM_COMMISSION_RATE) / 100;

          const vendorEarning = subtotal - commissionAmount;

          // Create SubOrder
          const subOrder = await tx.subOrder.create({
            data: {
              orderId: order.id,
              vendorId: vendorGroup.vendorId,
              subtotal,
              commissionAmount,
              vendorEarning,
              status: SubOrderStatus.PENDING,
              payoutStatus: PayoutStatus.PENDING,
            },
          });

          // Create OrderItems
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

        // Clear cart
        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
          },
        });

        // Return complete order
        const completeOrder = await tx.order.findUnique({
          where: {
            id: order.id,
          },
          include: {
            payment: true,
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

        if (!completeOrder) {
          throw new AppError(
            status.INTERNAL_SERVER_ERROR,
            "Failed to retrieve created order",
          );
        }

        return completeOrder;
      },
      {
        maxWait: 10000,
        timeout: 15000,
      },
    );

    return result;
  } catch (error) {
    console.log("CREATE PAY LATER ORDER ERROR:", error);
    throw error;
  }
};

const initiatePayment = async (userId: string, orderId: string) => {
  const orderData = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      payment: true,
      subOrders: {
        include: {
          items: true,
        },
      },
    },
  });
  if (!orderData) {
    throw new AppError(status.NOT_FOUND, "Order not found");
  }

  if (!orderData.payment) {
    throw new AppError(status.NOT_FOUND, "Payment not found for this order");
  }

  if (orderData.payment?.status === PaymentStatus.PAID) {
    throw new AppError(
      status.CONFLICT,
      "Payment already completed for this order",
    );
  }

  if (orderData.status === OrderStatus.CANCELLED) {
    throw new AppError(status.BAD_REQUEST, "Order is canceled");
  }

  const totalItems = orderData.subOrders.reduce((total, subOrder) => {
    return total + subOrder.items.length;
  }, 0);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: {
            name: `Order with ${totalItems} item(s)`,
          },
          unit_amount: orderData.totalAmount * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      orderId: orderData.id,
      paymentId: orderData.payment?.id,
    },
    success_url:
      `${envVars.FRONTEND_URL}` +
      `/dashboard/payment/payment-success` +
      `?order_id=${orderData.id}`,

    cancel_url:
      `${envVars.FRONTEND_URL}` + `/dashboard/order?payment=cancelled`,
  });

  await prisma.payment.update({
    where: {
      id: orderData.payment.id,
    },

    data: {
      paymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : undefined,
    },
  });
  return {
    paymentUrl: session.url,
    sessionId: session.id,
  };
};

const cancelUnpaidOrders = async () => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const unpaidOrders = await prisma.order.findMany({
    where: {
      createdAt: {
        lte: thirtyMinutesAgo,
      },
      status: OrderStatus.PENDING,
      payment: {
        status: PaymentStatus.UNPAID,
      },
    },
    select: {
      id: true,
      subOrders: {
        select: {
          items: {
            select: {
              productId: true,
              quantity: true,
            },
          },
        },
      },
    },
  });

  if (unpaidOrders.length === 0) {
    return;
  }
  for (const order of unpaidOrders) {
    try {
      await prisma.$transaction(async (tx) => {
        const cancelledOrder = await tx.order.updateMany({
          where: {
            id: order.id,
            status: OrderStatus.PENDING,
            payment: {
              status: PaymentStatus.UNPAID,
            },
          },
          data: {
            status: OrderStatus.CANCELLED,
          },
        });
        if (cancelledOrder.count === 0) {
          console.log(`Order ${order.id} already processed`);
          return;
        }

        //  Restore product stock
        for (const subOrder of order.subOrders) {
          for (const item of subOrder.items) {
            await tx.product.update({
              where: {
                id: item.productId,
              },

              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }

        await tx.payment.deleteMany({
          where: {
            orderId: order.id,
          },
        });

        console.log(`Order ${order.id},cancelled and stock restore`);
      });
    } catch (error) {
      console.error(`Failed to cancel order ${order.id}: `, error);
    }
  }
};
export const orderService = {
  createOrder,
  getAllOrder,
  getOrderById,
  orderWithPayLater,
  initiatePayment,
  cancelUnpaidOrders,
};
