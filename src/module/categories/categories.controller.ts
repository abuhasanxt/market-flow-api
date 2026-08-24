import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { categoriesService } from "./categories.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import AppError from "../../errorHelpers/AppError";

const createCategories = catchAsync(async (req: Request, res: Response) => {
  const authorId = req.user.userId;

  if (!authorId) {
    throw new AppError(status.UNAUTHORIZED, "You are unauthorized");
  }
  const result = await categoriesService.createCategories(authorId, req.body);
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Category Create successfully",
    data: result,
  });
});


const getAllCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoriesService.getAllCategory();
  sendResponse(res,{
   httpStatusCode:status.OK,
   success:true,
   message:"Categories fetching successfully",
   data:result
  })
});

export const categoriesController = {
  createCategories,
  getAllCategory
};
