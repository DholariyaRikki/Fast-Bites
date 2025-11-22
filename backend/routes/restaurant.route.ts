import express from "express"
import { createRestaurant, getRestaurant, getRestaurantOrder, getSingleRestaurant, searchRestaurant, updateOrderStatus, updateRestaurant, getRestaurantSuggestions, updateRestaurantStatus, toggleLikeRestaurant, getRestaurantLikes, getUserLikedRestaurants } from "../controller/restaurant.controller";
import upload from "../middlewares/multer";
import {isAuthenticated} from "../middlewares/isAuthenticated";

const router = express.Router();

router.route("/").post(isAuthenticated, upload.single("imageFile"), createRestaurant);
router.route("/").get(isAuthenticated, getRestaurant);
router.route("/").put(isAuthenticated, upload.single("imageFile"), updateRestaurant);
router.route("/order").get(isAuthenticated,  getRestaurantOrder);
router.route("/order/:orderId/status").put(isAuthenticated, updateOrderStatus);
router.route("/search/:searchText").get(isAuthenticated, searchRestaurant);
router.route("/suggestions").get(getRestaurantSuggestions);
router.route("/:id").get(isAuthenticated, getSingleRestaurant);
router.route("/:id/status").put(isAuthenticated, updateRestaurantStatus);
router.route("/:id/like").post(isAuthenticated, toggleLikeRestaurant);
router.route("/stats/likes").get(isAuthenticated, getRestaurantLikes);
router.route("/user/liked").get(isAuthenticated, getUserLikedRestaurants);

export default router;



