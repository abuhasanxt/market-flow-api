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


export const cartController={
    addToCart
}