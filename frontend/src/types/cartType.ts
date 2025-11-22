import { Key } from "react";
import { MenuItem } from "./restaurantType";

export interface CartItem {
  [x: string]: Key | null | undefined;
  _id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
} 

export interface CartState {
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  clearCart: () => void;
  removeFromTheCart: (id: string) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
} 