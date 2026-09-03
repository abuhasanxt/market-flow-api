import express from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/valideRequest";
import { createReviewSchema, updateReviewSchema } from "./reviews.validation";
import { reviewController } from "./reviews.controller";


const router = express.Router();

router.post(
  "/",
  checkAuth(Role.BUYER),
  validateRequest(createReviewSchema),
  reviewController.createReview,
);
router.patch("/:reviewId",checkAuth(Role.BUYER),validateRequest(updateReviewSchema),reviewController.updateReview)
router.get("/:id",checkAuth(Role.BUYER,Role.SELLER),reviewController.getProductIdByReview)
router.delete("/:reviewId",checkAuth(Role.BUYER,Role.SELLER),reviewController.deleteReview)

export const reviewRoutes = router;