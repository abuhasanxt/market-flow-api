import express from "express"
import { authController } from "./auth.controller"


const router=express.Router()

router.post("/register",authController.registerBuyer)


export const authRoutes=router