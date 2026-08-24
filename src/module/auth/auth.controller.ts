import { Request, Response } from "express";
import { authService } from "./auth.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { tokenUtils } from "../../utils/token";
import AppError from "../../errorHelpers/AppError";

const registerBuyer = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerBuyer(req.body);
  sendResponse(res, {
    success: true,
    httpStatusCode: status.CREATED,
    message: "Buyer Registration successfully",
    data: result
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

const verifyEmail=catchAsync(async(req:Request,res:Response)=>{
  const result=await authService.verifyEmail(req.body)

  sendResponse(res,{
    success:true,
    httpStatusCode:status.OK,
    message:result.message
  })
})



const getNewToken=catchAsync(async(req:Request,res:Response)=>{

  const refreshToken=req.cookies.refreshToken

  const result=await authService.getNewToken(refreshToken)
  const {newAccessToken,newRefreshToken}=result

  tokenUtils.setAccessTokenCookie(res,newAccessToken)
  tokenUtils.setRefreshTokenCookie(res,newRefreshToken)

  sendResponse(res,{
    success:true,
    httpStatusCode:status.OK,
    message:"New tokens generate successfully",
    data:{
      newAccessToken,
      newRefreshToken
    }

  })
})

const logoutUser=catchAsync(async(req:Request,res:Response)=>{
  tokenUtils.clearAccessTokenCookie(res)
  tokenUtils.clearRefreshTokenCookie(res)
  
  const result=await authService.logoutUser()
   sendResponse(res,{
    success:true,
    httpStatusCode:status.OK,
    message:result.message,
  })

})

const updateMe=catchAsync(async(req:Request,res:Response)=>{
  const userId=req.user.userId

  if (!userId) {
    throw new AppError(status.UNAUTHORIZED,"You are unauthorized")
  }

  const result=await authService.updateMe(userId,req.body)

  sendResponse(res,{
    success:true,
    httpStatusCode:status.OK,
    message:"Profile update successfully",
    data:result
  })
})


const deleteMe=catchAsync(async(req:Request,res:Response)=>{
  const userId=req.user.userId

  if (!userId) {
    throw new AppError(status.UNAUTHORIZED,"You are unauthorized")
  }

  const result=await authService.deleteMe(userId)

  sendResponse(res,{
    success:true,
    httpStatusCode:status.OK,
    message:"Profile delete successfully",
    data:result
  })
})
export const authController = {
  registerBuyer,
  loginUser,
  getMe,
  verifyEmail,
  getNewToken,
  logoutUser,
  updateMe,
  deleteMe
};
