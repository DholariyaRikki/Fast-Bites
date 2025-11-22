import mongoose, { Document } from "mongoose";

export interface IReview {
    user: mongoose.Schema.Types.ObjectId;
    restaurant?: mongoose.Schema.Types.ObjectId;
    menuItem?: mongoose.Schema.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IReviewDocument extends IReview, Document {}

const reviewSchema = new mongoose.Schema<IReview>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant"
    },
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu"
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Create compound index to prevent duplicate reviews from same user
reviewSchema.index({ user: 1, restaurant: 1 }, { unique: true, sparse: true });
reviewSchema.index({ user: 1, menuItem: 1 }, { unique: true, sparse: true });

export const Review = mongoose.model("Review", reviewSchema);