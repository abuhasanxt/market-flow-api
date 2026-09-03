import express from "express"
import { checkAuth } from "../../middleware/checkAuth"
import { Role } from "../../../generated/prisma/enums"
import { vendorController } from "./vendor.controller"
import { validateRequest } from "../../middleware/valideRequest"
import { applyAsSellerZodSchema } from "./vendor.validation"


const router=express.Router()

router.post("/apply",checkAuth(Role.BUYER),validateRequest(applyAsSellerZodSchema),vendorController.applyAsSeller)
router.get("/balance",checkAuth(Role.SELLER),vendorController.getMyBalance)


export const vendorRoutes=router