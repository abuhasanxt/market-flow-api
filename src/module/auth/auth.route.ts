import express from "express"
import { authController } from "./auth.controller"
import { checkAuth } from "../../middleware/checkAuth"
import { validateRequest } from "../../middleware/valideRequest"
import { emailVerifyZodSchema, userLoginZodSchema, userRegisterZodSchema, userUpdateZodSchema } from "./auth.validation"



const router=express.Router()

router.post("/register",validateRequest(userRegisterZodSchema),authController.registerBuyer)
router.post("/login",validateRequest(userLoginZodSchema),authController.loginUser)
router.get("/me", checkAuth(),authController.getMe)
router.post("/email-verify",validateRequest(emailVerifyZodSchema),authController.verifyEmail)
router.post("/refresh",authController.getNewToken)
router.post("/logout",checkAuth(),authController.logoutUser)

router.patch("/me",validateRequest(userUpdateZodSchema),checkAuth(),authController.updateMe)

export const authRoutes=router