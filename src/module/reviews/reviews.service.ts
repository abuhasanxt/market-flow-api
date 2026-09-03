import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { SubOrderStatus } from "../../../generated/prisma/enums";

const createReview = async (
  buyerId: string,
  data: {
    productId: string;
    subOrderId: string;
    rating: number;
    comment?: string;
  },
) => {
  const { productId, subOrderId, rating, comment } = data;

  const result = await prisma.$transaction(
    async (tx) => {
      //  Check product
      const product = await tx.product.findUnique({
        where: {
          id: productId,
        },
      });

      if (!product) {
        throw new AppError(status.NOT_FOUND, "Product not found");
      }
      //  Check SubOrder
      const subOrder = await tx.subOrder.findUnique({
        where: {
          id: subOrderId,
        },
        include: {
          items: true,
          order: true,
        },
      });

      if (!subOrder) {
        throw new AppError(status.NOT_FOUND, "SubOrder not found");
      }
      //  Verify SubOrder belongs to this buyer
      if (subOrder.order.userId !== buyerId) {
        throw new AppError(
          status.FORBIDDEN,
          "You are not allowed to review this order",
        );
      }

      //  Check SubOrder is DELIVERED
      if (subOrder.status !== SubOrderStatus.DELIVERED) {
        throw new AppError(
          status.BAD_REQUEST,
          "You can review a product only after the order is delivered",
        );
      }
      //  Verify product was purchased in this SubOrder
      const purchasedProduct = subOrder.items.some(
        (item) => item.productId === productId,
      );

      if (!purchasedProduct) {
        throw new AppError(
          status.FORBIDDEN,
          "You did not purchase this product in this sub-order",
        );
      }
      //  Check duplicate review
      const existingReview = await tx.review.findFirst({
        where: {
          buyerId,
          productId,
        },
      });

      if (existingReview) {
        throw new AppError(
          status.CONFLICT,
          "You have already reviewed this product",
        );
      }

      //  Create review
      const review = await tx.review.create({
        data: {
          buyerId,
          productId,
          subOrderId,
          rating,
          comment,
        },
      });
      //  Calculate rating from Review table
      const ratingData = await tx.review.aggregate({
        where: {
          productId,
        },
        _avg: {
          rating: true,
        },
        _count: {
          rating: true,
        },
      });
      const ratingAvg = ratingData._avg.rating ?? 0;
      const ratingCount = ratingData._count.rating;

      //  Update Product rating
      const updatedProduct = await tx.product.update({
        where: {
          id: productId,
        },
        data: {
          ratingAvg: Number(ratingAvg.toFixed(2)),
          ratingCount,
        },
      });
      return {
        review,
        product: updatedProduct,
      };
    },
    {
      maxWait: 10000,
      timeout: 10000,
    },
  );

  return result;
};

const getProductIdByReview = async (productId: string) => {
  const review = await prisma.review.findMany({
    where: {
      productId,
    },
    select: {
      buyer: {
        select: {
          name: true,
          email: true,
        },
      },
      id: true,
      comment: true,
      rating: true,
    },
  });
  return review;
};

const updateReview = async (
  buyerId: string,
  reviewId: string,
  data: {
    rating?: number;
    comment?: string;
  },
) => {
  const { rating, comment } = data;
  //check review
  const review = await prisma.review.findUnique({
    where: {
      id: reviewId,
    },
  });
  if (!review) {
    throw new AppError(status.NOT_FOUND, "Review not found");
  }
  // Check ownership
  if (review.buyerId !== buyerId) {
    throw new AppError(
      status.FORBIDDEN,
      "You are not allowed to update this review",
    );
  }

  // Nothing to update
  if (rating === undefined && comment === undefined) {
    throw new AppError(
      status.BAD_REQUEST,
      "Please provide at least one field to update",
    );
  }
  const result = await prisma.$transaction(async (tx) => {
    //  Update review
    const updatedReview = await tx.review.update({
      where: {
        id: reviewId,
      },
      data: {
        ...(rating !== undefined && { rating }),
        ...(comment !== undefined && { comment }),
      },
    });

    //  Recalculate product rating
    const ratingData = await tx.review.aggregate({
      where: {
        productId: review.productId,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    const ratingAvg = ratingData._avg.rating ?? 0;
    const ratingCount = ratingData._count.rating;

    //  Update product
    await tx.product.update({
      where: {
        id: review.productId,
      },
      data: {
        ratingAvg: Number(ratingAvg.toFixed(2)),
        ratingCount,
      },
    });

    return updatedReview;
  });
  return result;
};
export const reviewService = {
  createReview,
  getProductIdByReview,
  updateReview,
};
