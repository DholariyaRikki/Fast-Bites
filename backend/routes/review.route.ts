import express from "express";
import { 
    createRestaurantReview, 
    getRestaurantReviews, 
    updateReview, 
    deleteReview, 
    getUserReviews 
} from "../controller/review.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";

const router = express.Router();

// Restaurant review routes
router.route("/restaurant/:restaurantId").post(isAuthenticated, createRestaurantReview);
router.route("/restaurant/:restaurantId").get(getRestaurantReviews);

// Common review routes
router.route("/:reviewId").put(isAuthenticated, updateReview);
router.route("/:reviewId").delete(isAuthenticated, deleteReview);
router.route("/user").get(isAuthenticated, getUserReviews);

export default router;