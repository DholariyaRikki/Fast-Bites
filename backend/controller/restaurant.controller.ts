import { Request, Response } from "express";
import { Restaurant } from "../models/restaurant.models";
import uploadImageOnCloudinary from "../utils/imageupload";
import { Order } from "../models/order.models";


export const createRestaurant = async (req: Request, res: Response) => {
    try {
        const { restaurantName, city, country, deliveryTime, cuisines } = req.body;
        const file = req.file; // The uploaded file from the request

        // Check if the user already has a restaurant
        const existingRestaurant = await Restaurant.findOne({ user: req.id });
        if (existingRestaurant) {
            return res.status(400).json({
                success: false,
                message: "Restaurant already exists for this user"
            });
        }

        // Ensure an image file is provided
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Image is required"
            });
        }

        // Upload the image to Cloudinary
        const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File); // Specify folder name

        // Create the restaurant in the database
        await Restaurant.create({
            user: req.id,
            restaurantname: restaurantName,
            city,
            country,
            deliverytime: deliveryTime,
            cuisines: JSON.parse(cuisines),
            imageUrl,
            status: 'open' // Explicitly set status to open for new restaurants
        });

        return res.status(201).json({
            success: true,
            message: "Restaurant added successfully"
        });
    } catch (error) {
        console.error("Error creating restaurant:", error); // Improved logging for debugging
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getRestaurant = async (req: Request, res: Response) => {
    try {
        const restaurant = await Restaurant.findOne({ user: req.id }).populate('menus');
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                restaurant:[],
                message: "Restaurant not found"
            });
        };
        
        // Add likes count information for admin dashboard
        const restaurantObj = restaurant.toObject();
        const likesCount = restaurant.likes ? restaurant.likes.length : 0;
        
        return res.status(200).json({ 
            success: true, 
            restaurant: {
                ...restaurantObj,
                likesCount
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export const updateRestaurant = async (req: Request, res: Response) => {
    try {
        const { restaurantName, city, country, deliveryTime, cuisines } = req.body;
        const file = req.file;
        const restaurant = await Restaurant.findOne({ user: req.id });
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found"
            })
        };
        restaurant.restaurantname = restaurantName;
        restaurant.city = city;
        restaurant.country = country;
        restaurant.deliverytime = deliveryTime;
        restaurant.cuisines = JSON.parse(cuisines);

        if (file) {
            const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File);
            restaurant.imageUrl = imageUrl;
        }
        await restaurant.save();
        return res.status(200).json({
            success: true,
            message: "Restaurant updated",
            restaurant
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
}
export const getRestaurantOrder = async (req: Request, res: Response) => {
    try {
        const restaurant = await Restaurant.findOne({ user: req.id });
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found"
            })
        };
        const orders = await Order.find({ restaurant: restaurant._id }).populate('restaurant').populate('user');
        return res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
}
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            })
        }
        order.status = status;
        await order.save();
        return res.status(200).json({
            success: true,
            status:order.status,
            message: "Status updated"
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
}
export const searchRestaurant = async (req: Request, res: Response) => {
    try {
        const searchText = req.params.searchText || "";
        const searchQuery = req.query.searchQuery as string || "";
        const selectedCuisines = (req.query.selectedCuisines as string || "").split(",").filter(cuisine => cuisine);
        const selectedLocations = (req.query.selectedLocations as string || "").split(",").filter(location => location);
        const query: any = {};
        
        // Special case for "all" route or when no filters are applied
        if (searchText === "all" || (!searchText && !searchQuery && selectedCuisines.length === 0 && selectedLocations.length === 0)) {
            // Remove the status filter entirely to show all restaurants
        } else if (searchText) {
            query.$or = [
                { restaurantname: { $regex: searchText, $options: 'i' } },
                { city: { $regex: searchText, $options: 'i' } },
                { country: { $regex: searchText, $options: 'i' } },
                { cuisines: { $regex: searchText, $options: 'i' } }
            ]
        }
        
        // filter on the basis of searchQuery
        if (searchQuery) {
            if (!query.$or) query.$or = [];
            query.$or.push(
                { restaurantname: { $regex: searchQuery, $options: 'i' } },
                { cuisines: { $regex: searchQuery, $options: 'i' } },
                { city: { $regex: searchQuery, $options: 'i' } },
                { country: { $regex: searchQuery, $options: 'i' } }
            );
        }
        
        // Create an array to hold all the AND conditions
        const andConditions = [];
        
        // Add cuisine filter if any cuisines are selected
        if(selectedCuisines.length > 0){
            andConditions.push({ cuisines: {$in: selectedCuisines} });
        }
        
        // Add location filter if any locations are selected
        if(selectedLocations.length > 0){
            andConditions.push({
                $or: [
                    { city: { $in: selectedLocations.map(loc => new RegExp(loc, 'i')) } },
                    { country: { $in: selectedLocations.map(loc => new RegExp(loc, 'i')) } }
                ]
            });
        }
        
        // Combine with the main query
        if (andConditions.length > 0) {
            if (Object.keys(query).length > 0) {
                // If we already have a query, add these conditions with $and
                query.$and = andConditions;
            } else {
                // If no existing query, just use $and directly
                query.$and = andConditions;
            }
        }
        
        // Status filter is permanently removed to show all restaurants
        
        const restaurants = await Restaurant.find(query);
        
        // Get the current user ID from the authenticated request
        const userId = req.id;
        
        // Process each restaurant to add like information
        const processedRestaurants = restaurants.map(restaurant => {
            const restaurantObj = restaurant.toObject();
            const userHasLiked = restaurant.likes && restaurant.likes.some(
                (likeId: any) => likeId.toString() === userId
            );
            
            return {
                ...restaurantObj,
                userHasLiked,
                likeCount: restaurant.likes ? restaurant.likes.length : 0
            };
        });
        
        return res.status(200).json({
            success: true,
            data: processedRestaurants
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
}
export const getSingleRestaurant = async (req:Request, res:Response) => {
    try {
        const restaurantId = req.params.id;
        const restaurant = await Restaurant.findById(restaurantId).populate({
            path:'menus',
            options:{createdAt:-1}
        });
        if(!restaurant){
            return res.status(404).json({
                success:false,
                message:"Restaurant not found"
            })
        };

        // Check if the current user has liked this restaurant
        const userId = req.id;
        const userHasLiked = restaurant.likes && restaurant.likes.some(
            (likeId: any) => likeId.toString() === userId
        );

        return res.status(200).json({
            success: true, 
            restaurant: {
                ...restaurant.toObject(),
                userHasLiked,
                likeCount: restaurant.likes.length
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
}
export const getRestaurantSuggestions = async (req: Request, res: Response) => {
    try {
        const searchQuery = req.query.query as string || "";
        if (!searchQuery) {
            return res.status(200).json({
                success: true,
                suggestions: [],
                cuisineSuggestions: [],
                locationSuggestions: []
            });
        }

        // Get restaurant name suggestions
        const suggestions = await Restaurant.find({
            restaurantname: { $regex: searchQuery, $options: 'i' }
        })
        .select('restaurantname city country')
        .limit(5);

        // Get cuisine suggestions (unique cuisines that match the query)
        const cuisineResults = await Restaurant.aggregate([
            { $unwind: "$cuisines" },
            { $match: { cuisines: { $regex: searchQuery, $options: 'i' } } },
            { $group: { _id: "$cuisines" } },
            { $limit: 5 }
        ]);
        
        const cuisineSuggestions = cuisineResults.map(item => item._id);

        // Get location suggestions (cities and countries)
        const cityResults = await Restaurant.aggregate([
            { $match: { city: { $regex: searchQuery, $options: 'i' } } },
            { $group: { _id: "$city" } },
            { $limit: 3 }
        ]);
        
        const countryResults = await Restaurant.aggregate([
            { $match: { country: { $regex: searchQuery, $options: 'i' } } },
            { $group: { _id: "$country" } },
            { $limit: 3 }
        ]);
        
        const locationSuggestions = [
            ...cityResults.map(item => item._id),
            ...countryResults.map(item => item._id)
        ].slice(0, 5); // Limit to 5 total locations

        return res.status(200).json({
            success: true,
            suggestions,
            cuisineSuggestions,
            locationSuggestions
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export const updateRestaurantStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Expecting { status: 'open' | 'closed' }

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found!"
            });
        }

        restaurant.status = status; // Update the status
        await restaurant.save();

        return res.status(200).json({
            success: true,
            message: "Restaurant status updated",
            restaurant,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Get users who liked a restaurant (for admin dashboard)
export const getRestaurantLikes = async (req: Request, res: Response) => {
    try {
        // Find the restaurant for the current user (restaurant owner)
        const restaurant = await Restaurant.findOne({ user: req.id });
        
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
        }
        
        // Return the likes information
        return res.status(200).json({
            success: true,
            likesCount: restaurant.likes ? restaurant.likes.length : 0,
            // We can add more detailed information here if needed
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Get all restaurants liked by the current user
export const getUserLikedRestaurants = async (req: Request, res: Response) => {
    try {
        const userId = req.id;
        
        // Find all restaurants where the current user ID is in the likes array
        const likedRestaurants = await Restaurant.find({ 
            likes: { $in: [userId] }
        });
        
        // Process restaurants to include user-specific like info
        const processedRestaurants = likedRestaurants.map(restaurant => {
            const restaurantObj = restaurant.toObject();
            return {
                ...restaurantObj,
                userHasLiked: true, // We know the user has liked these
                likeCount: restaurant.likes ? restaurant.likes.length : 0
            };
        });
        
        return res.status(200).json({
            success: true,
            likedRestaurants: processedRestaurants
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Toggle like for a restaurant (like/unlike)
export const toggleLikeRestaurant = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.id; // Current user ID from authentication middleware

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
        }

        // Check if user already liked the restaurant
        const userLikedIndex = restaurant.likes.findIndex(
            (likeId) => likeId.toString() === userId
        );

        if (userLikedIndex === -1) {
            // User hasn't liked, so add like
            restaurant.likes.push(userId as any);
            await restaurant.save();
            return res.status(200).json({
                success: true,
                message: "Restaurant liked successfully",
                liked: true,
                likeCount: restaurant.likes.length,
                userId: userId
            });
        } else {
            // User already liked, so remove the like
            restaurant.likes.splice(userLikedIndex, 1);
            await restaurant.save();
            return res.status(200).json({
                success: true,
                message: "Restaurant unliked successfully",
                liked: false,
                likeCount: restaurant.likes.length,
                userId: userId
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}