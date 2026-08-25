import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { cartService } from "./cart.service";
import { sendResponse } from "../../shared/sendResponse";


const addToCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "You are Unauthorized");
  }
  const { items } = req.body;

  const result = await cartService.addToCart(userId, items);

  sendResponse(res, {
    success: true,
    httpStatusCode: status.CREATED,
    message: "Products added to cart successfully",
    data: result,
  });
});

const getCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "You are Unauthorized");
  }

  const result = await cartService.getCart(userId);

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Cart retrieved successfully",
    data: result,
  });
});



const updateCartItem = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { productId } = req.params;
  const { quantity } = req.body;
  const result = await cartService.updateCartItem(
    userId,
    productId as string,
    quantity,
  );

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Cart item updated successfully",
    data: result,
  });
});

const deleteCartItem = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;

  if (!userId) {
    throw new AppError(status.UNAUTHORIZED, "You are Unauthorized");
  }

  const { productId } = req.params;

  const result = await cartService.deleteCartItem(userId, productId as string);

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Cart item removed successfully",
    data: result,
  });
});


const clearCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const result = await cartService.clearCart(userId);

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Cart removed successfully",
    data: result,
  });
});
export const cartController={
    addToCart,
    getCart,
    updateCartItem,
    deleteCartItem,
    clearCart
}