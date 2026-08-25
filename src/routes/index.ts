import express from "express"
import { authRoutes } from "../module/auth/auth.route"
import { vendorRoutes } from "../module/vendor/vendor.route"
import { adminRoutes } from "../module/admin/admin.route"
import { categoriesRoutes } from "../module/categories/categories.route"
import { productRoutes } from "../module/products/product.route"

const router=express.Router()
router.use("/categories",categoriesRoutes)
router.use("/auth",authRoutes)
router.use("/vendors",vendorRoutes)
router.use("/admin",adminRoutes)
router.use("/products",productRoutes)

export const IndexRoute=router