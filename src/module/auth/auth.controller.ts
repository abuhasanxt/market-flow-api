import { Request, Response } from "express";
import { authService } from "./auth.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { tokenUtils } from "../../utils/token";
import AppError from "../../errorHelpers/AppError";

const registerBuyer = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerBuyer(req.body);
  const { accessToken, refreshToken, ...rest } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);

  sendResponse(res, {
    success: true,
    httpStatusCode: status.CREATED,
    message: "Buyer Registration successfully",
    data: {
      accessToken,
      refreshToken,
      ...rest,
    },
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);
  const { accessToken, refreshToken, ...rest } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);

  sendResponse(res, {
    success: true,
    httpStatusCode: status.OK,
    message: "User Login successfully",
    data: {
      accessToken,
      refreshToken,
      ...rest,
    },
  });
});

const getMe=catchAsync(async(req:Request,res:Response)=>{
  const userId=req.user.userId
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED,"You are unauthorized")
  }

  const result=await authService.getMe(userId)

  sendResponse(res,{
    success:true,
    httpStatusCode:status.OK,
    message:"Get my profile",
    data:result
  })
})
export const authController = {
  registerBuyer,
  loginUser,
  getMe
};
