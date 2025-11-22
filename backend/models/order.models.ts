import mongoose, { Document } from "mongoose";

type DeliveryDetails = {
    email: string;
    name: string;
    address: string;
    city: string;
}

type CartItems = {
    menuId: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
}

export interface IOrder extends Document {
    user: mongoose.Schema.Types.ObjectId;
    restaurant: mongoose.Schema.Types.ObjectId;
    deliveryDetails: DeliveryDetails,
    cartItems: CartItems;
    totalAmount: number;
    subtotal?: number; // Subtotal before delivery charge
    deliveryCharge?: number; // 20% delivery charge
    codCharge?: number; // 10% extra charge for cash on delivery
    paymentMethod: "stripe" | "cod"; // Payment method
    status: "pending" | "confirmed" | "preparing" | "outfordelivery" | "delivered" | "cancelled";
    acceptedBy?: mongoose.Schema.Types.ObjectId;
    cancellationReason?: string; // Reason for cancellation if order is cancelled
    offerCode?: string; // Applied offer code
    discountAmount?: number; // Discount amount from offer code
}

const orderSchema = new mongoose.Schema<IOrder>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    deliveryDetails:{
        email:{type:String, required:true},
        name:{type:String, required:true},
        address:{type:String, required:true},
        city:{type:String, required:true},
    },
    cartItems:[
        {
            menuId:{type:String, required:true},
            name:{type:String, required:true},
            image:{type:String, required:true},
            price:{type:Number, required:true},
            quantity:{type:Number, required:true},
        }
    ],
    totalAmount: Number,
    subtotal: Number, // Subtotal before delivery charge
    deliveryCharge: Number, // 15% delivery charge
    codCharge: Number, // 10% extra charge for cash on delivery
    paymentMethod: {
        type: String,
        enum: ["stripe", "cod"],
        required: true
    },
    status:{
        type:String,
        enum:["pending", "confirmed", "preparing", "outfordelivery", "delivered", "cancelled"],
        required:true
    },
    offerCode: String,
    discountAmount: Number,
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    cancellationReason: {
        type: String,
        default: null
    }

}, { timestamps: true });
export const Order = mongoose.model("Order", orderSchema);