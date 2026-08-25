/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { ProductData, ProductQuery } from "./product.interface";

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
    throw new AppError(status.FORBIDDEN, "Vendor is not approved");
  }

  //  Check category
  const category = await prisma.category.findUnique({
    where: {
      id: payload.categoryId,
    },
  });

  if (!category) {
    throw new AppError(status.NOT_FOUND, "Category Not Found");
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

const getAllProduct = async (query: ProductQuery) => {
  const {
    categoryId,
    vendorId,
    minPrice,
    maxPrice,
    inStock,
    q,
    sort = "createdAt",
    order = "desc",
    page = "1",
    limit = "1",
  } = query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  const where: any = {};

  // category filter
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (vendorId) {
    where.vendorId = vendorId;
  }

  // price filter
  if (minPrice || maxPrice) {
    where.price = {};

    if (minPrice) {
      where.price.gte = Number(minPrice);
    }

    if (maxPrice) {
      where.price.lte = Number(maxPrice);
    }
  }

  // stock filter
  if (inStock === "true") {
    where.stock = {
      gt: 0,
    };
  }

  if (inStock === "false") {
    where.stock = {
      equals: 0,
    };
  }

  // search
  if (q) {
    where.OR = [
      {
        name: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: q,
          mode: "insensitive",
        },
      },
    ];
  }

  // pagination
  const skip = (pageNumber - 1) * limitNumber;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        [sort]: order,
      },
      skip,
      take: limitNumber,
    }),

    prisma.product.count({
      where,
    }),
  ]);

  if (products.length === 0) {
    throw new AppError(status.NOT_FOUND, "Product not found");
  }

  return {
    products,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

export const productServices = {
  createProduct,
  getAllProduct,
};
