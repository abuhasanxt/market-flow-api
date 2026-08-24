import express from "express"
import { authController } from "./auth.controller"
import { checkAuth } from "../../middleware/checkAuth"



const router=express.Router()

router.post("/register",authController.registerBuyer)
router.post("/login",authController.loginUser)
router.get("/me", checkAuth(),authController.getMe)
router.post("/email-verify",authController.verifyEmail)
router.post("/refresh",authController.getNewToken)
router.post("/logout",checkAuth(),authController.logoutUser)

export const authRoutes=router