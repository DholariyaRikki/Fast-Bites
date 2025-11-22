import mongoose, { Document } from "mongoose";

export interface IMessage {
    userId: string;
    subject: string;
    message: string;
    status: 'pending' | 'resolved' | 'in-progress';
    priority: 'low' | 'medium' | 'high';
    reply?: {
        adminId: string;
        message: string;
        timestamp: Date;
    };
    adminReply?: {
        adminId: string;
        message: string;
        timestamp: Date;
    };
}

export interface IMessageDocument extends IMessage, Document {
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new mongoose.Schema<IMessageDocument>({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'in-progress'],
        default: 'pending'
    },
    reply: {
        adminId: String,
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
    },
    adminReply: {
        adminId: String,
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
}, {
    timestamps: true
});

// Index for faster queries
messageSchema.index({ userId: 1, createdAt: -1 });
messageSchema.index({ status: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);