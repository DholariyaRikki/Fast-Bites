import jwt from "jsonwebtoken";
import { IUserDocument } from "../models/user.models";
import { Response } from "express";

export const generateToken = (res:Response, user:IUserDocument ) => {
    const token = jwt.sign({userId:user._id}, process.env.JWT_SECRET!, {expiresIn:'1d'});
    res.cookie("token", token, {httpOnly:true, sameSite:'strict', maxAge:24*60*60*1000});
    return token;
}