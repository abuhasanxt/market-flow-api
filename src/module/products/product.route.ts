import express from "express";
import { validateRequest } from "../../middleware/valideRequest";
import { createProductZodSchema, updateProductZodSchema } from "./product.validation";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { productController } from "./product.controller";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();

router.post(
  "/",checkAuth(Role.SELLER),multerUpload.single("imageUrl"),
  validateRequest(createProductZodSchema),
  
  productController.createProduct,
);
router.patch("/:id",checkAuth(Role.SELLER),
  validateRequest(updateProductZodSchema),productController.updateProduct)

router.delete("/:id",checkAuth(Role.SELLER),productController.deleteProduct)

router.get("/me",checkAuth(Role.SELLER),productController.getMyProduct)
router.get("/",productController.getAllProduct)
router.get("/:id",productController.getProductById)

export const productRoutes = router;
