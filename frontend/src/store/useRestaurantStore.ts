import { Order } from "@/types/orderType";
import { MenuItem } from "@/types/restaurantType";
import axios from "axios";
import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const API_END_POINT = "http://localhost:3350/api/restaurant";
axios.defaults.withCredentials = true;

export interface RestaurantState {
    loading: boolean;
    restaurant: any;
    searchedRestaurant: any;
    appliedFilter: string[];
    singleRestaurant: any;
    restaurantOrder: Order[];
    likeStats: {
        likesCount: number;
    } | null;
    likedRestaurants: any[];
    createRestaurant: (formData: FormData) => Promise<void>;
    getRestaurant: () => Promise<void>;
    updateRestaurant: (formData: FormData) => Promise<void>;
    searchRestaurant: (searchText: string, searchQuery: string, selectedFilters: any) => Promise<void>;
    addMenuToRestaurant: (menu: MenuItem) => void;
    updateMenuToRestaurant: (updatedMenu: MenuItem) => void;
    removeMenuFromRestaurant: (menuId: string) => void;
    setAppliedFilter: (value: string) => void;
    resetAppliedFilter: () => void;
    getSingleRestaurant: (restaurantId: string) => Promise<void>;
    getRestaurantOrders: () => Promise<void>;
    updateRestaurantOrder: (orderId: string, status: string) => Promise<void>;
    updateRestaurantStatus: (id: string, data: { status: 'open' | 'closed' }) => Promise<void>;
    toggleLike: (restaurantId: string) => Promise<void>;
    getRestaurantLikes: () => Promise<void>;
    getUserLikedRestaurants: () => Promise<void>;
}

export const useRestaurantStore = create<RestaurantState>()(persist((set, get) => ({
    loading: false,
    restaurant: null,
    searchedRestaurant: null,
    appliedFilter: [],
    singleRestaurant: null,
    restaurantOrder: [],
    likeStats: null,
    likedRestaurants: [],
    createRestaurant: async (formData: FormData) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false });
            }
        } catch (error: any) {
            toast.error(error.response.data.message);
            set({ loading: false });
        }
    },
    getRestaurant: async () => {
        try {
            set({ loading: true });
            const response = await axios.get(`${API_END_POINT}/`);
            if (response.data.success) {
                set({ loading: false, restaurant: response.data.restaurant });
            }
        } catch (error: any) {
            if (error.response.status === 404) {
                set({ restaurant: null });
            }
            set({ loading: false });
        }
    },
    updateRestaurant: async (formData: FormData) => {
        try {
            set({ loading: true });
            const response = await axios.put(`${API_END_POINT}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false });
            }
        } catch (error: any) {
            toast.error(error.response.data.message);
            set({ loading: false });
        }
    },
    searchRestaurant: async (searchText: string, searchQuery: string, selectedFilters: any) => {
        try {
            set({ loading: true });

            // Split filters into cuisines and locations
            const selectedCuisines: string[] = [];
            const selectedLocations: string[] = [];
            
            // Process filters - any filter with country or city is a location, otherwise cuisine
            selectedFilters.forEach((filter: string) => {
                const commonLocations = ["New York", "Mumbai", "London", "Tokyo", "Paris", 
                    "Sydney", "Chicago", "Delhi", "Bangkok", "Berlin", "USA", "India", "UK", 
                    "Japan", "France", "Australia", "China", "Italy", "Canada", "Spain"];
                
                if (commonLocations.some(loc => filter.toLowerCase().includes(loc.toLowerCase()))) {
                    selectedLocations.push(filter);
                } else {
                    selectedCuisines.push(filter);
                }
            });

            const params = new URLSearchParams();
            params.set("searchQuery", searchQuery);
            params.set("selectedCuisines", selectedCuisines.join(","));
            params.set("selectedLocations", selectedLocations.join(","));            
            const response = await axios.get(`${API_END_POINT}/search/${searchText}?${params.toString()}`);            
            if (response.data.success) {
                set({ loading: false, searchedRestaurant: response.data });
            }
        } catch (error) {
            console.error('Error searching restaurants:', error);
            set({ loading: false });
        }
    },
    addMenuToRestaurant: (menu: MenuItem) => {
        set((state: any) => ({
            restaurant: state.restaurant ? { ...state.restaurant, menus: [...state.restaurant.menus, menu] } : null,
        }))
    },
    updateMenuToRestaurant: (updatedMenu: MenuItem) => {
        set((state: any) => {
            if (state.restaurant) {
                const updatedMenuList = state.restaurant.menus.map((menu: any) => menu._id === updatedMenu._id ? updatedMenu : menu);
                return {
                    restaurant: {
                        ...state.restaurant,
                        menus: updatedMenuList
                    }
                }
            }
            return state;
        })
    },
    removeMenuFromRestaurant: (menuId: string) => {
        set((state: any) => {
            if (state.restaurant) {
                const filteredMenus = state.restaurant.menus.filter((menu: any) => menu._id !== menuId);
                return {
                    restaurant: {
                        ...state.restaurant,
                        menus: filteredMenus
                    }
                }
            }
            return state;
        })
    },
    setAppliedFilter: (value: string) => {
        set((state) => {
            const isAlreadyApplied = state.appliedFilter.includes(value);
            const updatedFilter = isAlreadyApplied ? state.appliedFilter.filter((item) => item !== value) : [...state.appliedFilter, value];
            return { appliedFilter: updatedFilter }
        })
    },
    resetAppliedFilter: () => {
        set({ appliedFilter: [] })
    },
    getSingleRestaurant: async (restaurantId: string) => {
        try {
            const response = await axios.get(`${API_END_POINT}/${restaurantId}`);
            if (response.data.success) {
                set({ singleRestaurant: response.data.restaurant })
            }
        } catch (error) { }
    },
    getRestaurantOrders: async () => {
        try {
            const response = await axios.get(`${API_END_POINT}/order`, {
                withCredentials: true
            });
            if (response.data.success) {
                set({ restaurantOrder: response.data.orders });
            } else {
                console.error('API returned success: false in getRestaurantOrders');
            }
        } catch (error: any) {
            console.error('Error fetching restaurant orders:', error);
            // If there's a 404 error, set empty orders array to avoid UI breaking
            if (error.response && error.response.status === 404) {
                set({ restaurantOrder: [] });
            }
        }
    },
    updateRestaurantOrder: async (orderId: string, status: string) => {
        try {
            const response = await axios.put(`${API_END_POINT}/order/${orderId}/status`, { status }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success) {
                const updatedOrder = get().restaurantOrder.map((order: Order) => {
                    return order._id === orderId ? { ...order, status: response.data.status } : order;
                })
                set({ restaurantOrder: updatedOrder });
                toast.success(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response.data.message);
        }
    },
    updateRestaurantStatus: async (id, data) => {
        await axios.put(`${API_END_POINT}/${id}/status`, data);
    },
    toggleLike: async (restaurantId: string) => {
        try {
            const response = await axios.post(`${API_END_POINT}/${restaurantId}/like`);
            
            if (response.data.success) {
                // Update the singleRestaurant state with the new likes info
                set((state) => {
                    let updatedState = { ...state };
                    
                    // Update single restaurant view if it's the current one
                    if (state.singleRestaurant && state.singleRestaurant._id === restaurantId) {
                        updatedState.singleRestaurant = {
                            ...state.singleRestaurant,
                            userHasLiked: response.data.liked,
                            likeCount: response.data.likeCount
                        };
                    }
                    
                    // Update in search results if present
                    if (state.searchedRestaurant && state.searchedRestaurant.data) {
                        const updatedData = state.searchedRestaurant.data.map((restaurant: any) => {
                            if (restaurant._id === restaurantId) {
                                return {
                                    ...restaurant,
                                    userHasLiked: response.data.liked,
                                    likeCount: response.data.likeCount
                                };
                            }
                            return restaurant;
                        });
                        
                        updatedState.searchedRestaurant = {
                            ...state.searchedRestaurant,
                            data: updatedData
                        };
                    }
                    
                    // Update in likedRestaurants if present
                    if (state.likedRestaurants && state.likedRestaurants.length > 0) {
                        if (response.data.liked) {
                            // If liked and not already in likedRestaurants, fetch the restaurant data and add it
                            if (!state.likedRestaurants.some(r => r._id === restaurantId)) {
                                // Don't modify state here - we'll fetch updated list instead
                            }
                        } else {
                            // If unliked, remove from likedRestaurants
                            updatedState.likedRestaurants = state.likedRestaurants.filter(
                                restaurant => restaurant._id !== restaurantId
                            );
                        }
                    }
                    
                    return updatedState;
                });
                
                toast.success(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error toggling like");
        }
    },
    getRestaurantLikes: async () => {
        try {
            const response = await axios.get(`${API_END_POINT}/stats/likes`);
            if (response.data.success) {
                set({ likeStats: response.data });
            }
        } catch (error) {
            console.error("Error fetching restaurant likes stats:", error);
        }
    },
    getUserLikedRestaurants: async () => {
        try {
            set({ loading: true });
            const response = await axios.get(`${API_END_POINT}/user/liked`);
            if (response.data.success) {
                set({ 
                    likedRestaurants: response.data.likedRestaurants,
                    loading: false 
                });
            } else {
                set({ loading: false });
            }
        } catch (error) {
            console.error("Error fetching user's liked restaurants:", error);
            set({ loading: false });
        }
    }
}), {
    name: 'restaurant-name',
    storage: createJSONStorage(() => localStorage)
}))