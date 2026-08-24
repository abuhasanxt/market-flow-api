import express from "express"
import { checkAuth } from "../../middleware/checkAuth"
import { Role } from "../../../generated/prisma/enums"
import { vendorController } from "./vendor.controller"


const router=express.Router()

router.post("/apply",checkAuth(Role.BUYER),vendorController.applyAsSeller)


export const vendorRoutes=router