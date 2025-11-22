import { Request, Response } from "express";
import { Message } from "../models/message.models";
import { User } from "../models/user.models";

// ========== User: Create new support message ==========
export const createMessage = async (req: Request, res: Response) => {
    try {
        const userId = req.id;
        const { subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Subject and message are required"
            });
        }

        const newMessage = await Message.create({
            userId,
            subject,
            message
        });

        // Populate user info
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('userId', 'fullname email');

        return res.status(201).json({
            success: true,
            message: "Support message created successfully",
            data: populatedMessage
        });
    } catch (error) {
        console.error("Error creating message:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========== User: Get user's messages ==========
export const getUserMessages = async (req: Request, res: Response) => {
    try {
        const userId = req.id;
        const page = Math.max(parseInt((req.query.page as string) || "1", 10), 1);
        const limit = Math.min(Math.max(parseInt((req.query.limit as string) || "10", 10), 1), 50);

        const messages = await Message.find({ userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Message.countDocuments({ userId });

        return res.status(200).json({
            success: true,
            data: messages,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching user messages:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========== SuperAdmin: Get all messages (with filtering) ==========
export const getAllMessages = async (req: Request, res: Response) => {
    try {
        const page = Math.max(parseInt((req.query.page as string) || "1", 10), 1);
        const limit = Math.min(Math.max(parseInt((req.query.limit as string) || "10", 10), 1), 100);
        const status = (req.query.status as string) || undefined;
        const search = (req.query.search as string || "").trim();

        const query: any = {};
        
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: "i" } },
                { message: { $regex: search, $options: "i" } }
            ];
        }

        const messages = await Message.find(query)
            .populate('userId', 'fullname email contact')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Message.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: messages,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching all messages:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========== SuperAdmin: Get single message by ID ==========
export const getMessageById = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId)
            .populate('userId', 'fullname email contact')
            .populate('reply.adminId', 'fullname email')
            .populate('adminReply.adminId', 'fullname email');

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error("Error fetching message:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========== SuperAdmin: Reply to user message ==========
export const replyToMessage = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const { replyMessage } = req.body;
        const adminId = req.id;

        if (!replyMessage) {
            return res.status(400).json({
                success: false,
                message: "Reply message is required"
            });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        // Update the message with admin reply
        message.adminReply = {
            adminId: adminId || '',
            message: replyMessage,
            timestamp: new Date()
        };
        
        message.status = 'in-progress';
        await message.save();

        // Populate admin info
        const populatedMessage = await Message.findById(messageId)
            .populate('userId', 'fullname email')
            .populate('adminReply.adminId', 'fullname email');

        return res.status(200).json({
            success: true,
            message: "Reply sent successfully",
            data: populatedMessage
        });
    } catch (error) {
        console.error("Error replying to message:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========== SuperAdmin: Mark message as resolved ==========
export const resolveMessage = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        message.status = 'resolved';
        await message.save();

        return res.status(200).json({
            success: true,
            message: "Message marked as resolved"
        });
    } catch (error) {
        console.error("Error resolving message:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========== SuperAdmin: Update message status ==========
export const updateMessageStatus = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const { status } = req.body;

        if (!['pending', 'resolved', 'in-progress'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Allowed: 'pending' | 'resolved' | 'in-progress'"
            });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        message.status = status;
        await message.save();

        return res.status(200).json({
            success: true,
            message: "Message status updated",
            data: message
        });
    } catch (error) {
        console.error("Error updating message status:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
