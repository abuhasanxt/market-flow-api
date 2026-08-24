import express from "express"
import { validateRequest } from "../../middleware/valideRequest"
import { categoryZodSchema } from "./categories.validation"
import { checkAuth } from "../../middleware/checkAuth"
import { Role } from "../../../generated/prisma/enums"
import { categoriesController } from "./categories.controller"



const router=express.Router()

router.post("/",validateRequest(categoryZodSchema),checkAuth(Role.ADMIN), categoriesController.createCategories)
router.get("/",checkAuth(Role.ADMIN,Role.SELLER),categoriesController.getAllCategory)



export const categoriesRoutes=router