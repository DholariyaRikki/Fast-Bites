import express from "express"
import {isAuthenticated, isSuperAdmin} from "../middlewares/isAuthenticated";
import { acceptOrderForDelivery, createCheckoutSession, getOrders, getOrdersForDelivery, getDeliveryHistory, markOrderAsDelivered, stripeWebhook, cancelOrder, adminCancelOrder, superadminRestaurantMonthlyIncome, superadminDeliveryMonthlyIncome } from "../controller/order.controller";
const router = express.Router();

router.route("/").get(isAuthenticated, getOrders);
router.route("/checkout/create-checkout-session").post(isAuthenticated, createCheckoutSession);
router.route("/webhook").post(express.raw({type: 'application/json'}), stripeWebhook);
router.route("/delivery").get(isAuthenticated, getOrdersForDelivery);
router.route("/delivery/history").get(isAuthenticated, getDeliveryHistory);
router.route("/:orderId/accept").post(isAuthenticated, acceptOrderForDelivery);
router.route("/:orderId/deliver").post(isAuthenticated, markOrderAsDelivered);
router.route("/:orderId/cancel").post(isAuthenticated, cancelOrder);
router.route("/:orderId/admin-cancel").post(isAuthenticated, adminCancelOrder);

// SuperAdmin payments
router.route("/superadmin/payments/restaurant-monthly").get(isAuthenticated, isSuperAdmin, superadminRestaurantMonthlyIncome);
router.route("/superadmin/payments/delivery-monthly").get(isAuthenticated, isSuperAdmin, superadminDeliveryMonthlyIncome);

export default router;