export interface User {
    id: string;
    email: string;
    fullname: string;
    username?: string;
    contact: string;
    isverified: boolean;
    admin?: boolean;
    delivery?: boolean;
    superAdmin?: boolean;
    address: string;
    city: string;
    country: string;
    profilePicture: string;
} 