import mongoose, { Document } from "mongoose";

export interface IOffer extends Document {
    code: string;
    description: string;
    discountType: "percentage" | "fixed";
    discountValue: number; // Percentage (0-100) or fixed amount
    maxDiscountAmount?: number; // Maximum discount cap for percentage
    minOrderAmount?: number; // Minimum order amount required
    validFrom: Date;
    validUntil: Date;
    usageLimit?: number; // Maximum number of times this code can be used
    usageCount: number; // Number of times already used
    isActive: boolean;
    createdBy: mongoose.Schema.Types.ObjectId;
}

const offerSchema = new mongoose.Schema<IOffer>({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    discountType: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true
    },
    discountValue: {
        type: Number,
        required: true
    },
    maxDiscountAmount: {
        type: Number,
        default: null
    },
    minOrderAmount: {
        type: Number,
        default: 0
    },
    validFrom: {
        type: Date,
        required: true
    },
    validUntil: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        default: null
    },
    usageCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Index for faster queries
offerSchema.index({ code: 1 });
offerSchema.index({ validFrom: 1, validUntil: 1 });
offerSchema.index({ isActive: 1 });

export const Offer = mongoose.model("Offer", offerSchema);