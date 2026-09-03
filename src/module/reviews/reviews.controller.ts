import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { reviewService } from "./reviews.service";


const createReview = catchAsync(
  async (req: Request, res: Response) => {
    const buyerId = req.user.userId;

    const result = await reviewService.createReview(
      buyerId,
      req.body,
    );

    sendResponse(res, {
      success: true,
      httpStatusCode: status.CREATED,
      message: "Review created successfully.",
      data: result,
    });
  },
);
const getProductIdByReview = catchAsync(
  async (req: Request, res: Response) => {
    const { productId } = req.params;

    const result = await reviewService.getProductIdByReview(productId as string);

    sendResponse(res, {
      success: true,
      httpStatusCode: status.OK,
      message: "Review retrieved successfully.",
      data: result,
    });
  },
);

const updateReview = catchAsync(
  async (req: Request, res: Response) => {
    const { reviewId } = req.params;
    const buyerId=req.user.userId

    const result = await reviewService.updateReview(buyerId, reviewId as string,req.body);

    sendResponse(res, {
      success: true,
      httpStatusCode: status.OK,
      message: "Review update successfully.",
      data: result,
    });
  },
);
export const reviewController = {
  createReview,
  getProductIdByReview,
  updateReview
};