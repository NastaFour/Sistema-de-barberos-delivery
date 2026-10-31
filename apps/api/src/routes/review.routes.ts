import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as reviewController from "../controllers/review.controller";
import { authenticate } from "../middleware/auth.middleware";

const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many reviews, please try again later",
  },
});

const router: Router = Router();

router.post("/", authenticate, reviewLimiter, reviewController.createReview);
router.get("/barber/:barberId", reviewController.getBarberReviews);
router.get("/my-reviews", authenticate, reviewController.getMyReviews);

export default router;
