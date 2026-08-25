import express from "express"
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { createCartZodSchema, updateCartZodSchema } from "./card.validation";
import { cartController } from "./cart.controller";
import { validateRequest } from "../../middleware/valideRequest";


const router=express.Router()


router.post(
  "/items",
  checkAuth(Role.BUYER),
  validateRequest(createCartZodSchema),
  cartController.addToCart,
);
router.patch(
  "/items/:productId",
  checkAuth(Role.BUYER),
  validateRequest(updateCartZodSchema),
  cartController.updateCartItem,
);
router.delete(
  "/items/:productId",
  checkAuth(Role.BUYER),
  cartController.deleteCartItem,
);
router.delete(
  "/",
  checkAuth(Role.BUYER),
  cartController.clearCart,
);
router.get("/", checkAuth(Role.BUYER), cartController.getCart);

export const cartRoutes=router