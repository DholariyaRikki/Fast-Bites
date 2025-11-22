import { Request, Response } from "express";
import { Offer } from "../models/offer.models";
import { Order } from "../models/order.models";

export const createOffer = async (req: Request, res: Response) => {
    try {
        const {
            code,
            description,
            discountType,
            discountValue,
            maxDiscountAmount,
            minOrderAmount,
            validFrom,
            validUntil,
            usageLimit
        } = req.body;

        // Validate required fields
        if (!code || !description || !discountType || !discountValue || !validFrom || !validUntil) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided"
            });
        }

        // Check if offer code already exists
        const existingOffer = await Offer.findOne({ code: code.toUpperCase() });
        if (existingOffer) {
            return res.status(400).json({
                success: false,
                message: "Offer code already exists"
            });
        }

        // Validate dates
        const now = new Date();
        const startDate = new Date(validFrom);
        const endDate = new Date(validUntil);

        if (startDate < now) {
            return res.status(400).json({
                success: false,
                message: "Valid from date must be in the future"
            });
        }

        if (endDate <= startDate) {
            return res.status(400).json({
                success: false,
                message: "Valid until date must be after valid from date"
            });
        }

        // Validate discount value
        if (discountType === "percentage" && (discountValue < 0 || discountValue > 100)) {
            return res.status(400).json({
                success: false,
                message: "Percentage discount must be between 0 and 100"
            });
        }

        if (discountType === "fixed" && discountValue <= 0) {
            return res.status(400).json({
                success: false,
                message: "Fixed discount must be greater than 0"
            });
        }

        const offer = new Offer({
            code: code.toUpperCase(),
            description,
            discountType,
            discountValue,
            maxDiscountAmount,
            minOrderAmount,
            validFrom: startDate,
            validUntil: endDate,
            usageLimit,
            createdBy: req.id
        });

        await offer.save();

        return res.status(201).json({
            success: true,
            message: "Offer created successfully",
            offer
        });
    } catch (error) {
        console.error("Error creating offer:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getAllOffers = async (req: Request, res: Response) => {
    try {
        const offers = await Offer.find()
            .populate('createdBy', 'fullname email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            offers
        });
    } catch (error) {
        console.error("Error fetching offers:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getOfferById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const offer = await Offer.findById(id).populate('createdBy', 'fullname email');

        if (!offer) {
            return res.status(404).json({
                success: false,
                message: "Offer not found"
            });
        }

        return res.status(200).json({
            success: true,
            offer
        });
    } catch (error) {
        console.error("Error fetching offer:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const updateOffer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            code,
            description,
            discountType,
            discountValue,
            maxDiscountAmount,
            minOrderAmount,
            validFrom,
            validUntil,
            usageLimit,
            isActive
        } = req.body;

        const offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).json({
                success: false,
                message: "Offer not found"
            });
        }

        // Check if code is being changed and if it already exists
        if (code && code.toUpperCase() !== offer.code) {
            const existingOffer = await Offer.findOne({ code: code.toUpperCase() });
            if (existingOffer) {
                return res.status(400).json({
                    success: false,
                    message: "Offer code already exists"
                });
            }
            offer.code = code.toUpperCase();
        }

        // Update fields if provided
        if (description) offer.description = description;
        if (discountType) offer.discountType = discountType;
        if (discountValue !== undefined) {
            // Validate discount value
            if (discountType === "percentage" && (discountValue < 0 || discountValue > 100)) {
                return res.status(400).json({
                    success: false,
                    message: "Percentage discount must be between 0 and 100"
                });
            }
            if (discountType === "fixed" && discountValue <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Fixed discount must be greater than 0"
                });
            }
            offer.discountValue = discountValue;
        }
        if (maxDiscountAmount !== undefined) offer.maxDiscountAmount = maxDiscountAmount;
        if (minOrderAmount !== undefined) offer.minOrderAmount = minOrderAmount;
        if (validFrom) {
            const startDate = new Date(validFrom);
            if (startDate < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: "Valid from date must be in the future"
                });
            }
            offer.validFrom = startDate;
        }
        if (validUntil) {
            const endDate = new Date(validUntil);
            if (endDate <= offer.validFrom) {
                return res.status(400).json({
                    success: false,
                    message: "Valid until date must be after valid from date"
                });
            }
            offer.validUntil = endDate;
        }
        if (usageLimit !== undefined) offer.usageLimit = usageLimit;
        if (isActive !== undefined) offer.isActive = isActive;

        await offer.save();

        return res.status(200).json({
            success: true,
            message: "Offer updated successfully",
            offer
        });
    } catch (error) {
        console.error("Error updating offer:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const deleteOffer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const offer = await Offer.findById(id);

        if (!offer) {
            return res.status(404).json({
                success: false,
                message: "Offer not found"
            });
        }

        // Check if offer has been used
        if (offer.usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete offer that has been used"
            });
        }

        await Offer.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Offer deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting offer:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const validateOfferCode = async (req: Request, res: Response) => {
    try {
        const { code, subtotal } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Offer code is required"
            });
        }

        const offer = await Offer.findOne({ 
            code: code.toUpperCase(),
            isActive: true 
        });

        if (!offer) {
            return res.status(404).json({
                success: false,
                message: "Invalid offer code"
            });
        }

        // Check if offer is valid
        const now = new Date();
        if (now < offer.validFrom || now > offer.validUntil) {
            return res.status(400).json({
                success: false,
                message: "Offer code is expired or not yet valid"
            });
        }

        // Check usage limit
        if (offer.usageLimit && offer.usageCount >= offer.usageLimit) {
            return res.status(400).json({
                success: false,
                message: "Offer code has reached its usage limit"
            });
        }

        // Check minimum order amount
        if (subtotal && offer.minOrderAmount && subtotal < offer.minOrderAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount of ${offer.minOrderAmount} is required`
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (offer.discountType === "percentage") {
            discountAmount = (subtotal * offer.discountValue) / 100;
            if (offer.maxDiscountAmount) {
                discountAmount = Math.min(discountAmount, offer.maxDiscountAmount);
            }
        } else {
            discountAmount = offer.discountValue;
        }

        return res.status(200).json({
            success: true,
            offer: {
                code: offer.code,
                description: offer.description,
                discountType: offer.discountType,
                discountValue: offer.discountValue,
                discountAmount,
                minOrderAmount: offer.minOrderAmount,
                validUntil: offer.validUntil
            }
        });
    } catch (error) {
        console.error("Error validating offer code:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};