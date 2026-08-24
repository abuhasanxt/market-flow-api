import express from "express"
import { authRoutes } from "../module/auth/auth.route"
import { vendorRoutes } from "../module/vendor/vendor.route"

const router=express.Router()

router.use("/auth",authRoutes)
router.use("/vendors",vendorRoutes)

export const IndexRoute=router