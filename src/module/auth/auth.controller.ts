
import { Request, Response } from "express";
import { authService } from "./auth.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const registerBuyer = catchAsync(async(req:Request,res:Response)=>{
  const result =await authService.registerBuyer(req.body)
  sendResponse(res,{
    success:true,
    httpStatusCode:status.CREATED,
    message:"Buyer Registration successfully",
    data:result

  })
})

const loginUser = catchAsync(async(req:Request,res:Response)=>{
  const result =await authService.loginUser(req.body)
  sendResponse(res,{
    success:true,
    httpStatusCode:status.OK,
    message:"User Login successfully",
    data:result

  })
})


export const authController={
    registerBuyer,
    loginUser
}
