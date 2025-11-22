import { CheckoutSessionRequest, OrderState } from "@/types/orderType";
import axios from "axios";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { toast } from "sonner";

const API_END_POINT: string = "http://localhost:3350/api/order";
axios.defaults.withCredentials = true;

export const useOrderStore = create<OrderState>()(persist((set => ({
    cancelOrder: async (orderId: string, reason: string) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/${orderId}/cancel`, { reason });
            if (response.data.success) {
                toast.success("Order cancelled successfully");
                // Refresh order list after cancellation
                const orderResponse = await axios.get(`${API_END_POINT}/?populate=true`);
                set({ orders: orderResponse.data.orders });
            }
            set({ loading: false });
        } catch (error: any) {
            set({ loading: false });
            toast.error(error.response?.data?.message || "Failed to cancel order");
        }
    },
    adminCancelOrder: async (orderId: string, reason: string) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/${orderId}/admin-cancel`, { reason });
            if (response.data.success) {
                toast.success("Order cancelled successfully by admin");
                // Refresh order list after cancellation
                const orderResponse = await axios.get(`${API_END_POINT}/?populate=true`);
                set({ orders: orderResponse.data.orders });
            }
            set({ loading: false });
        } catch (error: any) {
            set({ loading: false });
            toast.error(error.response?.data?.message || "Failed to cancel order");
        }
    },
    loading: false,
    orders: [],
    deliveryOrders: [],
    createCheckoutSession: async (checkoutSession: CheckoutSessionRequest) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/checkout/create-checkout-session`, checkoutSession, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            window.location.href = response.data.session.url;
            set({ loading: false });
        } catch (error) {
            set({ loading: false });
        }
    },
    getOrderDetails: async () => {
        try {
            set({loading:true});
            const response = await axios.get(`${API_END_POINT}/?populate=true`);            
            set({loading:false, orders:response.data.orders});
        } catch (error) {
            console.error("Error fetching order details:", error);
            set({loading:false});
        }
    },
    getDeliveryOrders: async () => {
        try {
            set({loading: true});
            const response = await axios.get(`${API_END_POINT}/delivery`);
            const historyResponse = await axios.get(`${API_END_POINT}/delivery/history`);
            if (response.data.success) {
                // Merge both sets of orders
                const allOrders = [
                    ...(response.data.orders || []),
                    ...(historyResponse.data.success ? historyResponse.data.orders : [])
                ];
                set({deliveryOrders: allOrders});
            } else {
                console.error("API returned success: false in getDeliveryOrders");
            }
            set({loading: false});
        } catch (error: any) {
            console.error('Error fetching delivery orders:', error);
            set({loading: false, deliveryOrders: []});
        }
    },
    acceptOrderForDelivery: async (orderId: string) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/${orderId}/accept`);
            
            if (response.data.success) {
                try {
                    const refreshResponse = await axios.get(`${API_END_POINT}/delivery`);
                    if (refreshResponse.data.success) {
                        set({ deliveryOrders: refreshResponse.data.orders });
                    }
                } catch (error) {
                    console.error("Error refreshing delivery orders:", error);
                }
                
                toast.success(response.data.message);
            }
            set({ loading: false });
        } catch (error: any) {
            console.error("Accept order error:", error);
            toast.error(error.response?.data?.message || "Failed to accept order");
            set({ loading: false });
        }
    },
    markOrderAsDelivered: async (orderId: string) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/${orderId}/deliver`);
            
            if (response.data.success) {
                set((state) => ({
                    deliveryOrders: state.deliveryOrders.filter(order => order._id !== orderId)
                }));
                
                // Refresh all delivery orders list
                try {
                    const refreshResponse = await axios.get(`${API_END_POINT}/delivery`);
                    if (refreshResponse.data.success) {
                        set({ deliveryOrders: refreshResponse.data.orders });
                    }
                } catch (error) {
                    console.error("Error refreshing delivery orders:", error);
                }
                
                toast.success(response.data.message);
            }
            set({ loading: false });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to mark order as delivered");
            set({ loading: false });
        }
    }
})), {
    name: 'order-name',
    storage: createJSONStorage(() => localStorage)
}))