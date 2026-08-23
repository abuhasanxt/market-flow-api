/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { authService } from "./auth.service";

const registerBuyer = async (req: Request, res: Response) => {
  try {
    const result = await authService.registerBuyer(req.body);
    res.status(200).json({
      success: true,
      message: "Buyer register successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(201).json({
      success: false,
      message: "Buyer register failed",
      error: error.message,
      details: error,
    });
  }
};


export const authController={
    registerBuyer
}
