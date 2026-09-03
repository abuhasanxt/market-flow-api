/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { ProductData, ProductQuery, ProductUpdate } from "./product.interface";
import { deleteFileFromCloudinary } from "../../config/cloudinary";
import { redisService } from "../../lib/redis";

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
   // Validate sorting
  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "price",
    "name",
    "ratingAvg",
    "ratingCount",
    "stock",
  ];

  if (!allowedSortFields.includes(sort)) {
    throw new AppError(
      status.BAD_REQUEST,
      "Invalid sort field",
    );
  }

  if (order !== "asc" && order !== "desc") {
    throw new AppError(
      status.BAD_REQUEST,
      "Order must be asc or desc",
    );
  }

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


  // Redis cache key
  const cacheKey = `products:${JSON.stringify({
    categoryId,
    vendorId,
    minPrice,
    maxPrice,
    inStock,
    q: q?.trim(),
    sort,
    order,
    page: pageNumber,
    limit: limitNumber,
  })}`;
   // Check Redis
   const cachedData = await redisService.get<{
    products: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(cacheKey);

   if (cachedData) {
    console.log("Products fetched from Redis");

    return cachedData;
  }
   // Database query
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
// Response
  const result = {
    products,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
    // Save in Redis
  await redisService.set(
    cacheKey,
    result,
    300, // 5 minutes
  );

  return result;
};

const getProductById = async (id: string) => {
  const result = await prisma.product.findFirst({
    where: {
      id,
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
      reviews: {
        select: {
          buyer: {
            select: {
              name: true,
            },
          },
          comment: true,
          rating: true,
        },
      },
      vendor: {
        select: {
          id: true,
          storeName: true,
          status: true,
          user: {
            select: {
              name: true,
              email: true,
              emailVerified: true,
              role: true,
            },
          },
        },
      },
    },
  });
  if (!result) {
    throw new AppError(status.NOT_FOUND, "Product not found");
  }
  return result;
};

const getMyProduct = async (userId: string) => {
  const vendor = await prisma.vendor.findUnique({
    where: {
      userId,
    },
  });

  if (!vendor) {
    throw new AppError(status.NOT_FOUND, "Vendor not found");
  }

  const result = await prisma.product.findMany({
    where: {
      vendorId: vendor.id,
    },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

const updateProduct = async (
  userId: string,
  id: string,
  payload: ProductUpdate,
) => {
  //  Find vendor by authenticated user
  const vendor = await prisma.vendor.findUnique({
    where: {
      userId,
    },
  });

  if (!vendor) {
    throw new AppError(status.NOT_FOUND, "Vendor not found");
  }

  //  Find product owned by this vendor
  const existingProduct = await prisma.product.findFirst({
    where: {
      id,
      vendorId: vendor.id,
    },
  });

  if (!existingProduct) {
    throw new AppError(
      status.NOT_FOUND,
      "Product not found or you are not the owner",
    );
  }

  //  Empty payload check
  if (Object.keys(payload).length === 0) {
    throw new AppError(
      status.BAD_REQUEST,
      "Please provide at least one field to update",
    );
  }

  //  Check whether data actually changed
  const isSame =
    (payload.name === undefined || payload.name === existingProduct.name) &&
    (payload.description === undefined ||
      payload.description === existingProduct.description) &&
    (payload.price === undefined || payload.price === existingProduct.price) &&
    (payload.stock === undefined || payload.stock === existingProduct.stock) &&
    (payload.imageUrl === undefined ||
      payload.imageUrl === existingProduct.imageUrl) &&
    (payload.isActive === undefined ||
      payload.isActive === existingProduct.isActive);

  if (isSame) {
    throw new AppError(
      status.CONFLICT,
      "Your provided data is already up to date",
    );
  }

  // Check whether new image is uploaded
  const isNewImageUploaded =
    payload.imageUrl !== undefined &&
    payload.imageUrl !== existingProduct.imageUrl;

  //  Update only owner's product
  const result = await prisma.product.update({
    where: {
      id: existingProduct.id,
    },
    data: payload,
  });

  // Delete old image from Cloudinary
  if (isNewImageUploaded && existingProduct.imageUrl) {
    try {
      await deleteFileFromCloudinary(existingProduct.imageUrl);
    } catch (error) {
      console.error("Old image deletion failed:", error);
    }
  }

  return result;
};

const deleteProduct = async (userId: string, id: string) => {
  //  Find vendor by authenticated user
  const vendor = await prisma.vendor.findUnique({
    where: {
      userId,
    },
  });

  if (!vendor) {
    throw new AppError(status.NOT_FOUND, "Vendor not found");
  }

  //  Find product owned by this vendor
  const existingProduct = await prisma.product.findFirst({
    where: {
      id,
      vendorId: vendor.id,
    },
  });

  if (!existingProduct) {
    throw new AppError(
      status.NOT_FOUND,
      "Product not found or you are not the owner",
    );
  }
  //  delete only owner's product
  await prisma.product.delete({
    where: {
      id: existingProduct.id,
    },
  });

  // Delete product image from Cloudinary
  if (existingProduct.imageUrl) {
    try {
      await deleteFileFromCloudinary(existingProduct.imageUrl);
    } catch (error) {
      console.error("Failed to delete product image from Cloudinary:", error);
    }
  }

  return { message: "Product deleted successfully" };
};
export const productServices = {
  createProduct,
  getAllProduct,
  getProductById,
  getMyProduct,
  updateProduct,
  deleteProduct,
};
