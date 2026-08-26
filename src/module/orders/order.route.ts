import express from "express"
import { checkAuth } from "../../middleware/checkAuth"
import { Role } from "../../../generated/prisma/enums"
import { orderController } from "./order.controller"


const router=express.Router()

router.post("/checkout",checkAuth(Role.BUYER),orderController.createOrder)


export const orderRoutes=router