import express from "express";
import { validateRequest } from "../../middleware/valideRequest";
import { createProductZodSchema } from "./product.validation";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { productController } from "./product.controller";

const router = express.Router();

router.post(
  "/",
  validateRequest(createProductZodSchema),
  checkAuth(Role.SELLER),
  productController.createProduct,
);

router.get("/",productController.getAllProduct)

export const productRoutes = router;
