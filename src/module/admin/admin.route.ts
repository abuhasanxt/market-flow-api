import express from "express"
import { adminController } from "./admin.controller"
import { checkAuth } from "../../middleware/checkAuth"
import { Role } from "../../../generated/prisma/enums"

const router=express.Router()

router.get("/vendors",checkAuth(Role.ADMIN),adminController.getAllSellerApply)
router.get("/vendors/pending",checkAuth(Role.ADMIN),adminController.getSellerPending)


export const adminRoutes=router