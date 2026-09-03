import express from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/valideRequest";
import { createReviewSchema } from "./reviews.validation";
import { reviewController } from "./reviews.controller";


const router = express.Router();

router.post(
  "/",
  checkAuth(Role.BUYER),
  validateRequest(createReviewSchema),
  reviewController.createReview,
);

router.get("/:id",checkAuth(Role.BUYER,Role.SELLER),reviewController.getProductIdByReview)

export const reviewRoutes = router;