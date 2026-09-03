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
  const {
    productId,
    subOrderId,
    rating,
    comment,
  } = data;

  //  Check product
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!product) {
    throw new AppError(
      status.NOT_FOUND,
      "Product not found",
    );
  }

  //  Check SubOrder
  const subOrder = await prisma.subOrder.findUnique({
    where: {
      id: subOrderId,
    },
    include: {
      items: true,
    },
  });

  if (!subOrder) {
    throw new AppError(
      status.NOT_FOUND,
      "SubOrder not found",
    );
  }

  //  Check SubOrder is DELIVERED
  if (subOrder.status !== SubOrderStatus.DELIVERED) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can review a product only after the order is delivered",
    );
  }

  // 4. Verify product was purchased in this SubOrder
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
  const existingReview = await prisma.review.findFirst({
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
  const review = await prisma.review.create({
    data: {
      buyerId,
      productId,
      subOrderId,
      rating,
      comment,
    },
  });

  return review;
};

const getProductIdByReview=async(productId:string)=>{
  const review=await prisma.review.findMany({
    where:{
      productId
    },
    select:{
      buyer:{
        select:{
          name:true,
          email:true
        }
      },
      comment:true,
      rating:true
    },
    
  })
  return review
}
export const reviewService = {
  createReview,
  getProductIdByReview
};