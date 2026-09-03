import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { vendorServices } from "./vendor.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const applyAsSeller=catchAsync(async(req:Request,res:Response)=>{

    const userId=req.user.userId

    const result=await vendorServices.applyAsSeller(userId,req.body)

    sendResponse(res,{
        success:true,
        httpStatusCode:status.CREATED,
        message:"Seller application submitted successfully .",
        data:result

    })
})

const getMyBalance=catchAsync(async(req:Request,res:Response)=>{

    const userId=req.user.userId

    const result=await vendorServices.getMyBalance(userId)

    sendResponse(res,{
        success:true,
        httpStatusCode:status.OK,
        message:"Get my balance .",
        data:result

    })
})




export const vendorController={
    applyAsSeller,
    getMyBalance
}