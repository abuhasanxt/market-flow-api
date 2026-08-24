import express from "express"
import { checkAuth } from "../../middleware/checkAuth"
import { Role } from "../../../generated/prisma/enums"
import { vendorController } from "./vendor.controller"
import { validateRequest } from "../../middleware/valideRequest"
import { applyAsSellerZodSchema } from "./vendor.validation"


const router=express.Router()

router.post("/apply",validateRequest(applyAsSellerZodSchema),checkAuth(Role.BUYER),vendorController.applyAsSeller)


export const vendorRoutes=router