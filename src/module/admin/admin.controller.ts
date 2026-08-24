import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import status from "http-status";
import { adminService } from "./admin.service";
import { sendResponse } from "../../shared/sendResponse";

const getAllSellerApply = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllSellerApply();
  
  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Apply seller retrieved successfully",
    data: result,
  });
});

export const adminController = {
  getAllSellerApply,
};
