import express from "express"
import { checkAuth } from "../../middleware/checkAuth"
import { Role } from "../../../generated/prisma/enums"
import { vendorController } from "./vendor.controller"
import { validateRequest } from "../../middleware/valideRequest"
import { applyAsSellerZodSchema, updateSubOrderStatusSchema } from "./vendor.validation"


const router=express.Router()

router.post("/apply",checkAuth(Role.BUYER),validateRequest(applyAsSellerZodSchema),vendorController.applyAsSeller)
router.get("/balance",checkAuth(Role.SELLER),vendorController.getMyBalance)
router.get(
  "/payouts",
  checkAuth(Role.SELLER),
  vendorController.getMyPayouts,
);
router.patch(
  "/sub-orders/:subOrderId/status",
  checkAuth(Role.SELLER),validateRequest(updateSubOrderStatusSchema),
  vendorController.updateSubOrderStatus,
);

export const vendorRoutes=router