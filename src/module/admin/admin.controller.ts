import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import status from "http-status";
import { adminService } from "./admin.service";
import { sendResponse } from "../../shared/sendResponse";
import AppError from "../../errorHelpers/AppError";

const getAllSellerApply = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllSellerApply();

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Apply seller retrieved successfully",
    data: result,
  });
});

const getSellerPending = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getSellerPending();
  
  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Apply seller retrieved successfully",
    data: result,
  });
});


const getSellerSuspend = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getSellerSuspend();
  
  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Apply seller retrieved successfully",
    data: result,
  });
});


const getSellerApproved = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getSellerApproved();
  
  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Seller retrieved successfully",
    data: result,
  });
});

const approveSeller = catchAsync(
  async (req: Request, res: Response) => {
    const { vendorId } = req.params;

    const result = await adminService.approveSeller(
      vendorId as string,
    );

    sendResponse(res, {
      success: true,
      httpStatusCode: status.OK,
      message: "Seller approved successfully.",
      data: result,
    });
  },
);


const suspendSeller = catchAsync(
  async (req: Request, res: Response) => {
    const { vendorId } = req.params;

    if (!vendorId) {
      throw new AppError(
        status.BAD_REQUEST,
        "Vendor ID is required.",
      );
    }

    const result = await adminService.suspendSeller(
      vendorId as string,
    );

    sendResponse(res, {
      success: true,
      httpStatusCode: status.OK,
      message: "Seller suspended successfully.",
      data: result,
    });
  },
);
export const adminController = {
  getAllSellerApply,
  getSellerPending,
  getSellerSuspend,
  getSellerApproved,
  approveSeller,
  suspendSeller
};
