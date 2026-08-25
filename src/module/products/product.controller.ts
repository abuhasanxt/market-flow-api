
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

const getAllProduct= catchAsync(async (req: Request, res: Response) => {
  
  const result = await productServices.getAllProduct(req.query);

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Products retrieved successfully",
    data: result,
  });
});


const getProductById= catchAsync(async (req: Request, res: Response) => {
  const {id}=req.params
  const result = await productServices.getProductById(id as string);

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Product retrieved successfully",
    data: result,
  });
});


const getMyProduct= catchAsync(async (req: Request, res: Response) => {
  const userId=req.user.userId
  const result = await productServices.getMyProduct(userId as string);

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "My Product retrieved successfully",
    data: result,
  });
});



const updateProduct= catchAsync(async (req: Request, res: Response) => {
  const userId=req.user.userId
  const {id}=req.params
  const result = await productServices.updateProduct(
    userId,
    id as string,
    req.body
  );

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: " Product update successfully",
    data: result,
  });
});



const deleteProduct= catchAsync(async (req: Request, res: Response) => {
  const userId=req.user.userId
  const {id}=req.params
  const result = await productServices.deleteProduct(
    userId,
    id as string,
  );

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Product delete successfully",
    data: result,
  });
});
export const productController = {
  createProduct,
  getAllProduct,
  getProductById,
  getMyProduct,
  updateProduct,
  deleteProduct
};
