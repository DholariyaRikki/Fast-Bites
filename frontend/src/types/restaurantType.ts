export interface MenuItem {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    isAvailable: boolean;
    rating?: number;
}

export interface RestaurantState {
    // ... existing types ...
    updateMenuToRestaurant: (updatedMenu: MenuItem) => void;
    removeMenuFromRestaurant: (menuId: string) => void;
    // ... rest of the types ...
}

export interface Restaurant {
    _id: string;
    restaurantname: string;
    city: string;
    country: string;
    imageUrl: string;
    cuisines: string[];
    status: string;
    deliverytime?: number;
    likes?: string[];
    userHasLiked?: boolean;
    likeCount?: number;
    rating?: number;
}