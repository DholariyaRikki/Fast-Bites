import { CartState } from "@/types/cartType";
import { MenuItem } from "@/types/restaurantType";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useUserStore } from "./useUserStore";

// Helper function to get current user ID
const getCurrentUserId = () => {
  const user = useUserStore.getState().user;
  return user?.id || 'guest';
};

// Subscribe to user store changes to reset cart when user changes
useUserStore.subscribe((state, prevState) => {
  const currentUserId = state.user?.id || state.user?.id;
  const prevUserId = prevState.user?.id;
  
  if (currentUserId !== prevUserId) {
    // User has changed, reset the cart
    useCartStore.getState().clearCart();
  }
});

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      addToCart: (item: MenuItem) => {
        set((state) => {
          const existingItem = state.cart.find((cartItem) => cartItem._id === item._id);
          if (existingItem) {
            return {
              cart: state.cart.map((cartItem) =>
                cartItem._id === item._id
                  ? { ...cartItem, quantity: cartItem.quantity + 1 }
                  : cartItem
              ),
            };
          } else {
            return {
              cart: [...state.cart, { ...item, quantity: 1 }],
            };
          }
        });
      },
      clearCart: () => set({ cart: [] }),
      removeFromTheCart: (id: string) => {
        set((state) => ({
          cart: state.cart.filter((item) => item._id !== id),
        }));
      },
      incrementQuantity: (id: string) => {
        set((state) => ({
          cart: state.cart.map((item) =>
            item._id === id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        }));
      },
      decrementQuantity: (id: string) => {
        set((state) => ({
          cart: state.cart
            .map((item) =>
              item._id === id ? { ...item, quantity: item.quantity - 1 } : item
            )
            .filter((item) => item.quantity > 0), // Removes items with quantity 0
        }));
      },
    }),
    {
      name: "fast-bites-cart",
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const userId = getCurrentUserId();
          const key = `${userId}-${name}`;
          const value = localStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          const userId = getCurrentUserId();
          const key = `${userId}-${name}`;
          localStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: (name) => {
          const userId = getCurrentUserId();
          const key = `${userId}-${name}`;
          localStorage.removeItem(key);
        },
      })),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Force a re-render with the correct user's cart
            const userId = getCurrentUserId();
            const key = `${userId}-fast-bites-cart`;
            const storedData = localStorage.getItem(key);
            if (storedData) {
              const parsedData = JSON.parse(storedData);
              if (parsedData.state && parsedData.state.cart) {
                state.cart = parsedData.state.cart;
              }
            }
          }
        };
      },
    }
  )
);
