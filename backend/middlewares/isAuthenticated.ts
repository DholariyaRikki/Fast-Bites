import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models";

declare global {
    namespace Express{
        interface Request {
            id?: string;
            user?: any;
        }
    }
}

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }
        // verify the token
        const decode = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
        // check is decoding was successfull
        if (!decode) {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            })
        }
        req.id = decode.userId;

        // attach minimal user to request for role checks
        try {
            const user = await User.findById(req.id).select("_id admin delivery superAdmin email fullname");
            (req as any).user = user;
        } catch {}

        next();
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
};

export const isSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.id) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }
        // prefer user attached by isAuthenticated, otherwise fetch
        let user = (req as any).user;
        if (!user) {
            user = await User.findById(req.id).select("_id superAdmin");
        }
        if (!user || !user.superAdmin) {
            return res.status(403).json({ success: false, message: "Forbidden: SuperAdmin only" });
        }
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}