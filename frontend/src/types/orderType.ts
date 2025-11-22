// src/types/orderType.ts

export interface CartItem {
    _id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
  }
  
  export interface DeliveryDetails {
    name: string;
    address: string;
    city: string;
  }
  
  export interface DeliveryHistoryEntry {
    status: string;
    timestamp: Date | string;
    updatedBy?: string; // ID of the user who updated the status
    notes?: string;
  }
  
  export interface Order {
    [x: string]: any;
    _id: string;
    deliveryDetails: DeliveryDetails;
    cartItems: CartItem[];
    status: string;
    acceptedBy?: string; // ID of the delivery person who accepted the order
    deliveryHistory?: DeliveryHistoryEntry[]; // History of delivery status changes
    totalAmount?: number; // Total amount including delivery charge
    subtotal?: number; // Subtotal before delivery charge
    deliveryCharge?: number; // 20% delivery charge
    restaurant?: {
      restaurantname: string;
      city: string;
      [key: string]: any;
    };
    createdAt?: string; // Timestamp when the order was created
    updatedAt?: string; // Timestamp when the order was last updated
  }
  
  // Define the CheckoutSessionRequest type
  export interface CheckoutSessionRequest {
    cartItems: {
      menuId: string;
      name: string;
      image: string;
      price: string; // Assuming price is a string for the request
      quantity: string; // Assuming quantity is a string for the request
    }[];
    deliveryDetails: {
      name: string;
      email: string;
      contact: string;
      address: string;
      city: string;
      country: string;
    };
    restaurantId: string;
    paymentMethod?: "stripe" | "cod";
    offerCode?: string;
  }
  
  // Define the OrderState type
  export interface OrderState {
    loading: boolean;
    orders: Order[]; // Customer orders
    deliveryOrders: Order[]; // Orders available for delivery
    createCheckoutSession: (checkoutSession: CheckoutSessionRequest) => Promise<void>;
    getOrderDetails: () => Promise<void>;
    getDeliveryOrders: () => Promise<void>;
    acceptOrderForDelivery: (orderId: string) => Promise<void>;
    markOrderAsDelivered: (orderId: string) => Promise<void>;
    cancelOrder: (orderId: string, reason: string) => Promise<void>;
    adminCancelOrder: (orderId: string, reason: string) => Promise<void>;
  }