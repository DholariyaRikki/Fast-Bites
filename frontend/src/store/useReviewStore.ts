import axios from "axios";
import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const API_END_POINT = "http://localhost:3350/api/review";
axios.defaults.withCredentials = true;

export interface Review {
    _id: string;
    user: {
        _id: string;
        fullname: string;
        profilePicture?: string;
    };
    rating: number;
    comment: string;
    createdAt: string;
}

export interface ReviewState {
    loading: boolean;
    reviews: Review[];
    error: string | null;
    
    // Restaurant reviews
    restaurantReviews: Review[];
    restaurantReviewsLoading: boolean;
    
    // Menu item reviews
    menuItemReviews: Review[];
    menuItemReviewsLoading: boolean;
    
    // User's reviews
    userReviews: Review[];
    userReviewsLoading: boolean;
    
    // Actions
    createRestaurantReview: (restaurantId: string, rating: number, comment: string) => Promise<void>;
    createMenuItemReview: (menuId: string, rating: number, comment: string) => Promise<void>;
    getRestaurantReviews: (restaurantId: string) => Promise<void>;
    getMenuItemReviews: (menuId: string) => Promise<void>;
    getUserReviews: () => Promise<void>;
    updateReview: (reviewId: string, rating: number, comment: string) => Promise<void>;
    deleteReview: (reviewId: string) => Promise<void>;
    clearError: () => void;
    reset: () => void;
}

export const useReviewStore = create<ReviewState>()(persist((set, get) => ({
    loading: false,
    reviews: [],
    error: null,
    restaurantReviews: [],
    restaurantReviewsLoading: false,
    menuItemReviews: [],
    menuItemReviewsLoading: false,
    userReviews: [],
    userReviewsLoading: false,
    
    createRestaurantReview: async (restaurantId: string, rating: number, comment: string) => {
        try {
            set({ loading: true, error: null });
            const response = await axios.post(`${API_END_POINT}/restaurant/${restaurantId}`, {
                rating,
                comment
            });
            
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false });
                // Refresh restaurant reviews
                await get().getRestaurantReviews(restaurantId);
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || "Failed to create review", loading: false });
            toast.error(error.response?.data?.message || "Failed to create review");
        }
    },
    
    createMenuItemReview: async (menuId: string, rating: number, comment: string) => {
        try {
            set({ loading: true, error: null });
            const response = await axios.post(`${API_END_POINT}/menu/${menuId}`, {
                rating,
                comment
            });
            
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false });
                // Refresh menu item reviews
                await get().getMenuItemReviews(menuId);
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || "Failed to create review", loading: false });
            toast.error(error.response?.data?.message || "Failed to create review");
        }
    },
    
    getRestaurantReviews: async (restaurantId: string) => {
        try {
            set({ restaurantReviewsLoading: true, error: null });
            const response = await axios.get(`${API_END_POINT}/restaurant/${restaurantId}`);
            
            if (response.data.success) {
                set({ restaurantReviews: response.data.reviews, restaurantReviewsLoading: false });
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || "Failed to fetch reviews", restaurantReviewsLoading: false });
            toast.error(error.response?.data?.message || "Failed to fetch reviews");
        }
    },
    
    getMenuItemReviews: async (menuId: string) => {
        try {
            set({ menuItemReviewsLoading: true, error: null });
            const response = await axios.get(`${API_END_POINT}/menu/${menuId}`);
            
            if (response.data.success) {
                set({ menuItemReviews: response.data.reviews, menuItemReviewsLoading: false });
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || "Failed to fetch reviews", menuItemReviewsLoading: false });
            toast.error(error.response?.data?.message || "Failed to fetch reviews");
        }
    },
    
    getUserReviews: async () => {
        try {
            set({ userReviewsLoading: true, error: null });
            const response = await axios.get(`${API_END_POINT}/user`);
            
            if (response.data.success) {
                set({ userReviews: response.data.reviews, userReviewsLoading: false });
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || "Failed to fetch reviews", userReviewsLoading: false });
            toast.error(error.response?.data?.message || "Failed to fetch reviews");
        }
    },
    
    updateReview: async (reviewId: string, rating: number, comment: string) => {
        try {
            set({ loading: true, error: null });
            const response = await axios.put(`${API_END_POINT}/${reviewId}`, {
                rating,
                comment
            });
            
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false });
                // Refresh user reviews
                await get().getUserReviews();
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || "Failed to update review", loading: false });
            toast.error(error.response?.data?.message || "Failed to update review");
        }
    },
    
    deleteReview: async (reviewId: string) => {
        try {
            set({ loading: true, error: null });
            const response = await axios.delete(`${API_END_POINT}/${reviewId}`);
            
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false });
                // Refresh user reviews
                await get().getUserReviews();
            }
        } catch (error: any) {
            set({ error: error.response?.data?.message || "Failed to delete review", loading: false });
            toast.error(error.response?.data?.message || "Failed to delete review");
        }
    },
    
    clearError: () => set({ error: null }),
    
    reset: () => set({
        loading: false,
        reviews: [],
        error: null,
        restaurantReviews: [],
        restaurantReviewsLoading: false,
        menuItemReviews: [],
        menuItemReviewsLoading: false,
        userReviews: [],
        userReviewsLoading: false
    })
}), {
    name: 'review-storage',
    storage: createJSONStorage(() => localStorage)
}));