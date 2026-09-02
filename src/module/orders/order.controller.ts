import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { orderService } from "./order.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;

  const result = await orderService.createOrder(userId);

  sendResponse(res, {
    success: true,
    httpStatusCode: status.CREATED,
    message: "Orders Created successfully",
    data: result,
  });
});


const getAllOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;

  const result = await orderService.getAllOrder(userId, role);

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Order fetching successfully",
    data: result,
  });
});


const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;
  const {id}=req.params

  const result = await orderService.getOrderById(userId, role,id as string);

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "Order fetching successfully",
    data: result,
  });
});


const orderWithPayLater=catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const result = await orderService.orderWithPayLater(
    userId, 
  );

  sendResponse(res, {
    success: true,
    httpStatusCode: status.CREATED,
    message: "Order create successfully with Pay Later option",
    data: result,
  });
});

export const orderController = {
  createOrder,
  getAllOrder,
  getOrderById,
  orderWithPayLater
};
