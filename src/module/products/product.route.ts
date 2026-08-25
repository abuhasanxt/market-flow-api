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
router.get("/me",checkAuth(Role.SELLER),productController.getMyProduct)
router.get("/",productController.getAllProduct)
router.get("/:id",productController.getProductById)

export const productRoutes = router;
