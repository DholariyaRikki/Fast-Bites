import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import axios from "axios";
import { LoginInputState, SignupInputState } from "@/schema/userSchema";
import { toast } from "sonner";
import { User } from '../types/User';

const API_END_POINT = "http://localhost:3350/api/user"
axios.defaults.withCredentials = true;

type UserState = {
    user: User | null;
    isAuthenticated: boolean;
    isCheckingAuth: boolean;
    loading: boolean;
    signup: (input:SignupInputState) => Promise<void>;
    login: (input:LoginInputState) => Promise<void>;
    verifyEmail: (verificationCode: string) => Promise<void>;
    resendVerificationCode: (email: string) => Promise<void>;
    checkAuthentication: () => Promise<void>;
    logout: () => Promise<void>;
    forgotPassword: (email:string) => Promise<void>;
    resetPassword: (token:string, newPassword:string) => Promise<void>;
    updateProfile: (input: User) => Promise<void>;
    // Superadmin APIs
    superadminFetchUsers: (params?: { page?: number; limit?: number; search?: string }) => Promise<{ data:any[]; pagination:any } | void>;
    superadminChangeRole: (userId: string, role: "user" | "admin" | "delivery") => Promise<void>;
    // Payments
    superadminFetchRestaurantMonthly: (params?: { month?: number; year?: number }) => Promise<{ data:any[]; summary:any } | void>;
    superadminFetchDeliveryMonthly: (params?: { month?: number; year?: number }) => Promise<{ data:any[]; summary:any } | void>;
}

export const useUserStore = create<UserState>()(persist((set, get) => ({
    user: null,
    isAuthenticated: false,
    isCheckingAuth: true,
    loading: false,
    // signup api implementation
    signup: async (input: SignupInputState) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/signup`, input, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success) { 
                toast.success(response.data.message);
                set({ loading: false, user: response.data.user, isAuthenticated: true });
            }
        } catch (error: any) {
            toast.error(error.response.data.message);
            set({ loading: false });
        }
    },
    login: async (input: LoginInputState) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/login`, input, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success) { 
                let user = response.data.user;
                
                if (user._id && !user.id) {
                    user = { ...user, id: user._id.toString() };
                }
                
                toast.success(response.data.message);
                set({ loading: false, user: user, isAuthenticated: true });
            }
        } catch (error: any) {
            toast.error(error.response.data.message);
            set({ loading: false });
        }
    },
    verifyEmail: async (verificationCode: string) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/verify-email`, { verificationCode }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false, user: response.data.user, isAuthenticated: true });
            }
        } catch (error: any) {
            toast.error(error.response.data.message);
            set({ loading: false });
        }
    },
    resendVerificationCode: async (email: string) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/resend-verification-code`, { email }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success) {
                toast.success(response.data.message);
            }
        } catch (error: any) {
            toast.error(error.response.data.message || 'Failed to resend verification code');
        } finally {
            set({ loading: false });
        }
    },
    checkAuthentication: async () => {
        try {
            set({ isCheckingAuth: true });
    
            const response = await axios.get(`${API_END_POINT}/check-auth`);
            if (response.data.success) {
                let user = response.data.user;
                
                if (user._id && !user.id) {
                    user = { ...user, id: user._id.toString() };
                }
                
                set({
                    user: user,
                    isAuthenticated: true,
                    isCheckingAuth: false
                });
            } else {
                // Handle unexpected "success" responses (edge case)
                set({
                    isAuthenticated: false,
                    isCheckingAuth: false,
                });
            }
        } catch (error) {
            console.error("Authentication check error:", error);
            set({
                isAuthenticated: false,
                isCheckingAuth: false
            });
        }
    },
    
    logout: async () => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/logout`);
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false, user: null, isAuthenticated: false })
            }
        } catch (error:any) {
            toast.error(error.response.data.message);
            set({ loading: false });
        }
    },
    forgotPassword: async (email: string) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/forgot-password`, { email });
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false });
            }
        } catch (error: any) {
            toast.error(error.response.data.message);
            set({ loading: false });
        }
    },
    resetPassword: async (token: string, newPassword: string) => {
        try {
            set({ loading: true });
            const response = await axios.post(`${API_END_POINT}/reset-password/${token}`, { newPassword });
            if (response.data.success) {
                toast.success(response.data.message);
                set({ loading: false });
            }
        } catch (error: any) {
            toast.error(error.response.data.message);
            set({ loading: false });
        }
    },
    updateProfile: async (input: User) => {
        try {
            const response = await axios.put(`${API_END_POINT}/profile/update`, input, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success) {
                toast.success(response.data.message);
                set({ user: response.data.user, isAuthenticated: true });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    },

    // ========== Superadmin: list users ==========
    superadminFetchUsers: async (params?: { page?: number; limit?: number; search?: string }) => {
        try {
            const query = new URLSearchParams();
            if (params?.page) query.append("page", String(params.page));
            if (params?.limit) query.append("limit", String(params.limit));
            if (params?.search) query.append("search", params.search);

            const url = `${API_END_POINT}/superadmin/users${query.toString() ? `?${query.toString()}` : ""}`;
            const response = await axios.get(url);
            if (response.data.success) {
                return { data: response.data.data, pagination: response.data.pagination };
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch users');
        }
    },

    // ========== Superadmin: change role ==========
    superadminChangeRole: async (userId: string, role: "user" | "admin" | "delivery") => {
        try {
            const response = await axios.put(`${API_END_POINT}/superadmin/users/${userId}/role`, { role }, {
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.data.success) {
                toast.success(response.data.message || 'Role updated');
                // if current user changed, refresh auth
                const current = get().user;
                if (current && (current as any)._id?.toString?.() === userId) {
                    await get().checkAuthentication();
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update role');
        }
    },

    // ========== Superadmin: payments ==========
    superadminFetchRestaurantMonthly: async (params?: { month?: number; year?: number }) => {
        try {
            const q = new URLSearchParams();
            if (params?.month) q.append("month", String(params.month));
            if (params?.year) q.append("year", String(params.year));
            // order API base
            const ORDER_API = "http://localhost:3350/api/order";
            const url = `${ORDER_API}/superadmin/payments/restaurant-monthly${q.toString() ? `?${q.toString()}` : ""}`;
            const response = await axios.get(url);
            if (response.data?.success) {
                return { data: response.data.data, summary: response.data.summary };
            }
        } catch (error:any) {
            toast.error(error.response?.data?.message || "Failed to fetch restaurant monthly income");
        }
    },

    superadminFetchDeliveryMonthly: async (params?: { month?: number; year?: number }) => {
        try {
            const q = new URLSearchParams();
            if (params?.month) q.append("month", String(params.month));
            if (params?.year) q.append("year", String(params.year));
            const ORDER_API = "http://localhost:3350/api/order";
            const url = `${ORDER_API}/superadmin/payments/delivery-monthly${q.toString() ? `?${q.toString()}` : ""}`;
            const response = await axios.get(url);
            if (response.data?.success) {
                return { data: response.data.data, summary: response.data.summary };
            }
        } catch (error:any) {
            toast.error(error.response?.data?.message || "Failed to fetch delivery monthly income");
        }
    }
}),
    {
        name: 'user-name',
        storage: createJSONStorage(() => localStorage),
    }
))