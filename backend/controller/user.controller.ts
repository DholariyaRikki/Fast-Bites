import { Request, Response } from "express";
import { User } from "../models/user.models";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import cloudinary from "../utils/cloudinary";
import { generateVerificationCode } from "../utils/generateVerificationCode";
import { generateToken } from "../utils/generatetoken";
import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from "../utils/email/email.service";
import dotenv from "dotenv";
dotenv.config();

// ========== SuperAdmin: List all users (paginated, minimal filters) ==========
export const superadminListUsers = async (req: Request, res: Response) => {
    try {
        const page = Math.max(parseInt((req.query.page as string) || "1", 10), 1);
        const limit = Math.min(Math.max(parseInt((req.query.limit as string) || "10", 10), 1), 100);
        const search = (req.query.search as string || "").trim();

        const query: any = {};
        if (search) {
            query.$or = [
                { fullname: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { contact: { $regex: search, $options: "i" } }
            ];
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            User.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success:false, message: "Internal server error" });
    }
};

// ========== SuperAdmin: Change role (admin / delivery / user) ==========
export const superadminChangeUserRole = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { role } = req.body as { role: "admin" | "delivery" | "user" };

        if (!role || !["admin", "delivery", "user"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role. Allowed: 'admin' | 'delivery' | 'user'"
            });
        }

        // Prevent superadmin self-demotion guard optional (only if body userId equals req.id)
        // if (userId === req.id) return res.status(400).json({ success:false, message:"Cannot change your own role here" });

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success:false, message: "User not found" });
        }

        // Reset role flags
        user.admin = false;
        user.delivery = false;

        // Apply selected role
        if (role === "admin") user.admin = true;
        if (role === "delivery") user.delivery = true;
        // role === "user" leaves both false

        await user.save();

        const updated = await User.findById(userId).select("-password");

        return res.status(200).json({
            success: true,
            message: "User role updated",
            user: updated
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success:false, message: "Internal server error" });
    }
};

export const signup = async (req: Request, res: Response) => {
    try {
        const { fullname, email, password, contact } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: "User already exist with this email"
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken =  generateVerificationCode();

        user = await User.create({
            fullname,
            email,
            password: hashedPassword,
            contact: Number(contact),
            verificationtoken: verificationToken,
            verificationtokenexpireat: Date.now() + 24 * 60 * 60 * 1000,
        })
        generateToken(res,user);

        await sendVerificationEmail(email, verificationToken);

        const userWithoutPassword = await User.findOne({ email }).select("-password");
        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: userWithoutPassword
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
};
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Incorrect email or password"
            });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect email or password"
            });
        }
        generateToken(res, user);
        user.lastlogin = new Date();
        await user.save();

        // send user without passowrd
        const userWithoutPassword = await User.findOne({ email }).select("-password");
        return res.status(200).json({
            success: true,
            message: `Welcome back ${user.fullname}`,
            user: userWithoutPassword
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
}
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { verificationCode } = req.body;
       
        const user = await User.findOne({ verificationtoken: verificationCode, verificationtokenexpireat: { $gt: Date.now() } }).select("-password");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification token"
            });
        }
        user.isverified = true;
        user.verificationtoken = undefined;
        user.verificationtokenexpireat = undefined
        await user.save();

        // send welcome email
        await sendWelcomeEmail(user.email, user.fullname);

        return res.status(200).json({
            success: true,
            message: "Email verified successfully.",
            user,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
}
export const logout = async (_: Request, res: Response) => {
    try {
        return res.clearCookie("token").status(200).json({
            success: true,
            message: "Logged out successfully."
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
};
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User doesn't exist"
            });
        }

        const resetToken = crypto.randomBytes(40).toString('hex');
        const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

        user.resetpasswordtoken = resetToken;
        user.resetpasswordtokenexpire = resetTokenExpiresAt;
        await user.save();

        // send email
        await sendPasswordResetEmail(user.email, `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`);

        return res.status(200).json({
            success: true,
            message: "Password reset link sent to your email"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;
        const user = await User.findOne({ resetpasswordtoken: token, resetpasswordtokenexpire: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }
        //update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetpasswordtoken = undefined;
        user.resetpasswordtokenexpire = undefined;
        await user.save();

        // send success reset email
        await sendResetSuccessEmail(user.email);

        return res.status(200).json({
            success: true,
            message: "Password reset successfully."
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export const checkAuth = async (req: Request, res: Response) => {
    try {
        const userId = req.id;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        };
        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.id;
        const { fullname, email, address, city, country, profilePicture } = req.body;

        // Check if profilePicture exists and upload it to Cloudinary
        let cloudResponse;
        if (profilePicture) {
            try {
                cloudResponse = await cloudinary.uploader.upload(profilePicture, {
                    folder: "user_profiles",
                    resource_type: "image"
                });
            } catch (err) {
                return res.status(500).json({ message: "Error uploading image" });
            }
        }

        // Prepare updated data, conditionally adding profilePicture if upload succeeded
        const updatedData: any = {
            fullname,
            email,
            address,
            city,
            country,
        };

        if (cloudResponse?.secure_url) {
            updatedData.profilePicture = cloudResponse.secure_url; // Store the Cloudinary URL
        }

        // Update user in the database
        const user = await User.findByIdAndUpdate(userId, updatedData, { new: true }).select("-password");

        return res.status(200).json({
            success: true,
            user,
            message: "Profile updated successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const resendVerificationCode = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }
        
        if (user.isverified) {
            return res.status(400).json({
                success: false,
                message: "This email is already verified"
            });
        }
        
        // Generate new verification code
        const verificationToken = generateVerificationCode();
        user.verificationtoken = verificationToken;
        user.verificationtokenexpireat = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await user.save();
        
        // Send email with new verification code
        await sendVerificationEmail(user.email, verificationToken);
        
        return res.status(200).json({
            success: true,
            message: "A new verification code has been sent to your email"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};