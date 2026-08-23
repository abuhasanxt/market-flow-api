import express from "express"
import { authRoutes } from "../module/auth/auth.route"

const router=express.Router()

router.use("/auth",authRoutes)

export const IndexRoute=router