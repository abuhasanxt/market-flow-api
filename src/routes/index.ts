import express from "express"
import { authRoutes } from "../module/auth/auth.route"
import { vendorRoutes } from "../module/vendor/vendor.route"
import { adminRoutes } from "../module/admin/admin.route"

const router=express.Router()

router.use("/auth",authRoutes)
router.use("/vendors",vendorRoutes)
router.use("/admin",adminRoutes)

export const IndexRoute=router