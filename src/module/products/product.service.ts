import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { ProductData } from "./product.interface";

const createProduct = async (
  userId: string,
  payload: Omit<ProductData, "id" | "createdAt" | "updatedAt">,
) => {
  //  Find vendor using authenticated user's ID
  const vendor = await prisma.vendor.findUnique({
    where: {
      userId,
    },
  });

  if (!vendor) {
    throw new AppError(status.NOT_FOUND, "Vendor Not Found");
  }

  //  Vendor approval check
  if (vendor.status !== "APPROVED") {
    throw new AppError(
      status.FORBIDDEN,
      "Vendor is not approved",
    );
  }

  //  Check category
  const category = await prisma.category.findUnique({
    where: {
      id: payload.categoryId,
    },
  });

  if (!category) {
    throw new AppError(
      status.NOT_FOUND,
      "Category Not Found",
    );
  }

  //  Create product
  const result = await prisma.product.create({
    data: {
      ...payload,
      vendorId: vendor.id,
    },
  });

  return result;
};

export const productServices = {
  createProduct,
};
