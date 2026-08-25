import express from "express"
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { createCartZodSchema } from "./card.validation";
import { cartController } from "./cart.controller";
import { validateRequest } from "../../middleware/valideRequest";


const router=express.Router()


router.post(
  "/items",
  checkAuth(Role.BUYER),
  validateRequest(createCartZodSchema),
  cartController.addToCart,
);
router.get("/", checkAuth(Role.BUYER), cartController.getCart);

export const cartRoutes=router