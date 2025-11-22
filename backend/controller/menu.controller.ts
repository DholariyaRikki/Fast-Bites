import { Request, Response } from "express";
import uploadImageOnCloudinary from "../utils/imageupload";
import {Menu} from "../models/menu.models";
import { Restaurant } from "../models/restaurant.models";
import mongoose, { ObjectId } from "mongoose";

export const addMenu = async (req:Request, res:Response) => {
    try {
        const {name, description, price} = req.body;
        const file = req.file;
        if(!file){
            return res.status(400).json({
                success:false,
                message:"Image is required"
            })
        };
        const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File);
        const menu: any = await Menu.create({
            name , 
            description,
            price,
            image:imageUrl
        });
        const restaurant = await Restaurant.findOne({user:req.id});
        if(restaurant){
            (restaurant.menus as mongoose.Schema.Types.ObjectId[]).push(menu._id);
            await restaurant.save();
        }

        return res.status(201).json({
            success:true,
            message:"Menu added successfully",
            menu
        });
    } catch (error) {
        return res.status(500).json({message:"Internal server error"}); 
    }
}
export const editMenu = async (req:Request, res:Response) => {
    try {
        const {id} = req.params;
        const {name, description, price} = req.body;
        const file = req.file;
        const menu = await Menu.findById(id);
        if(!menu){
            return res.status(404).json({
                success:false,
                message:"Menu not found!"
            })
        }
        if(name) menu.name = name;
        if(description) menu.description = description;
        if(price) menu.price = price;

        if(file){
            const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File);
            menu.image = imageUrl;
        }
        await menu.save();

        return res.status(200).json({
            success:true,
            message:"Menu updated",
            menu,
        })
    } catch (error) {
        return res.status(500).json({message:"Internal server error"}); 
    }
}

export const updateMenuAvailability = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isAvailable } = req.body;
        
        const menu = await Menu.findById(id);
        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found"
            });
        }
        
        menu.isAvailable = isAvailable;
        await menu.save();
        
        return res.status(200).json({
            success: true,
            message: `Menu marked as ${isAvailable ? 'available' : 'unavailable'}`,
            menu
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteMenu = async (req: Request, res: Response) => {
    try {
        const menuId = req.params.id;
        const menu = await Menu.findByIdAndDelete(menuId);
        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Menu deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete menu"
        });
    }
};