import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { ProductData } from "./product.interface";

const createProduct = async (
  sellerId: string,
  payload: Omit<ProductData, "id" | "createdAt" | "updatedAt">,
) => {
  const category = await prisma.category.findUnique({
    where: {
      id: payload.categoryId,
    },
  });

  if (!category) {
    throw new AppError(status.NOT_FOUND, "Category Not Found");
  }

  const result = await prisma.product.create({
    data: {
      sellerId,
      ...payload,
    },
  });

  return result;
};

export const productServices = {
  createProduct,
};
