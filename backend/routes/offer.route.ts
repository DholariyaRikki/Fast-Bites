import express from "express";
import { isAuthenticated, isSuperAdmin } from "../middlewares/isAuthenticated";
import { createOffer, getAllOffers, getOfferById, updateOffer, deleteOffer, validateOfferCode } from "../controller/offer.controller";

const router = express.Router();

// Public route for validating offer codes
router.route("/validate").post(validateOfferCode);

// Protected routes for super admin only
router.route("/").get(isAuthenticated, isSuperAdmin, getAllOffers);
router.route("/create").post(isAuthenticated, isSuperAdmin, createOffer);
router.route("/:id").get(isAuthenticated, isSuperAdmin, getOfferById);
router.route("/:id").put(isAuthenticated, isSuperAdmin, updateOffer);
router.route("/:id").delete(isAuthenticated, isSuperAdmin, deleteOffer);

export default router;