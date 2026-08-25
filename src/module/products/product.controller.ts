import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { productServices } from "./product.service";
import { sendResponse } from "../../shared/sendResponse";

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "You are unauthorized");
  }

  const result = await productServices.createProduct(userId, req.body);

  sendResponse(res, {
    success: true,
    httpStatusCode: status.CREATED,
    message: "Product create successfully",
    data: result,
  });
});

export const productController = {
  createProduct,
};
