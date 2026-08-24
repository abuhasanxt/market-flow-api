import express from "express"
import { adminController } from "./admin.controller"
import { checkAuth } from "../../middleware/checkAuth"
import { Role } from "../../../generated/prisma/enums"

const router=express.Router()


router.patch("/vendors/:vendorId",checkAuth(Role.ADMIN),adminController.approveSeller)

router.get("/vendors",checkAuth(Role.ADMIN),adminController.getAllSellerApply)
router.get("/vendors/pending",checkAuth(Role.ADMIN),adminController.getSellerPending)

router.get("/vendors/suspend",checkAuth(Role.ADMIN),adminController.getSellerSuspend)

router.get("/vendors/approved",checkAuth(Role.ADMIN),adminController.getSellerApproved)

export const adminRoutes=router