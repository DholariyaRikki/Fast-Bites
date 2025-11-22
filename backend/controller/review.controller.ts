import { Request, Response } from "express";
import { Review } from "../models/review.models";
import { Restaurant } from "../models/restaurant.models";
import { Menu } from "../models/menu.models";
import mongoose from "mongoose";

// Create a review for a restaurant
export const createRestaurantReview = async (req: Request, res: Response) => {
    try {
        const { restaurantId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.id;

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        // Check if restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
        }

        // Check if user has already reviewed this restaurant
        const existingReview = await Review.findOne({ user: userId, restaurant: restaurantId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this restaurant"
            });
        }

        // Create new review
        const review = await Review.create({
            user: userId,
            restaurant: restaurantId,
            rating,
            comment
        });

        // Update restaurant's average rating
        const reviews = await Review.find({ restaurant: restaurantId });
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        restaurant.rating = averageRating;
        await restaurant.save();

        return res.status(201).json({
            success: true,
            message: "Review added successfully",
            review
        });

    } catch (error) {
        console.error("Error creating restaurant review:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get all reviews for a restaurant (limited to 5 random reviews)
export const getRestaurantReviews = async (req: Request, res: Response) => {
    try {
        const { restaurantId } = req.params;

        // Get total count for overall rating calculation
        const totalReviews = await Review.countDocuments({ restaurant: restaurantId });
        
        // Get 5 random reviews
        const reviews = await Review.aggregate([
            { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId) } },
            { $sample: { size: 5 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    rating: 1,
                    comment: 1,
                    createdAt: 1,
                    user: {
                        _id: 1,
                        fullname: 1,
                        profilePicture: 1
                    }
                }
            }
        ]);

        // Calculate overall rating
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

        return res.status(200).json({
            success: true,
            reviews,
            overallRating: averageRating,
            totalReviews
        });

    } catch (error) {
        console.error("Error fetching restaurant reviews:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Update a review
export const updateReview = async (req: Request, res: Response) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.id;

        // Validate rating
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        // Check if user owns the review
        if (review.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own reviews"
            });
        }

        // Update review
        if (rating) review.rating = rating;
        if (comment) review.comment = comment;
        await review.save();

        // Recalculate average rating for the restaurant
        if (review.restaurant) {
            const restaurant = await Restaurant.findById(review.restaurant);
            if (restaurant) {
                const reviews = await Review.find({ restaurant: review.restaurant });
                const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
                restaurant.rating = totalRating / reviews.length;
                await restaurant.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: "Review updated successfully",
            review
        });

    } catch (error) {
        console.error("Error updating review:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Delete a review
export const deleteReview = async (req: Request, res: Response) => {
    try {
        const { reviewId } = req.params;
        const userId = req.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        // Check if user owns the review
        if (review.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own reviews"
            });
        }

        const restaurantId = review.restaurant;

        // Delete the review
        await Review.findByIdAndDelete(reviewId);

        // Recalculate average rating for the restaurant
        if (restaurantId) {
            const restaurant = await Restaurant.findById(restaurantId);
            if (restaurant) {
                const reviews = await Review.find({ restaurant: restaurantId });
                const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
                restaurant.rating = reviews.length > 0 ? totalRating / reviews.length : 0;
                await restaurant.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting review:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get user's reviews
export const getUserReviews = async (req: Request, res: Response) => {
    try {
        const userId = req.id;

        const reviews = await Review.find({ user: userId, restaurant: { $exists: true } })
            .populate('restaurant', 'restaurantname imageUrl')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            reviews
        });

    } catch (error) {
        console.error("Error fetching user reviews:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};