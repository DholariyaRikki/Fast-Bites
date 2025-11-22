import mongoose,{Document} from "mongoose";

export interface Imenu{
    // _id:mongoose.Schema.Types.ObjectId
    name:string
    description:string
    price:number
    image:string
    isAvailable:boolean
    rating?: number
}

export interface ImenuDocument extends Imenu,Document{
    createdAt:Date
    updatedAt:Date
}

const menuSchema = new mongoose.Schema<Imenu>({
   
    name:{
        type:String,
        required:true
    },
    description:{
       type:String,
       required:true
    },
    price:{
        type:Number,
        required:true
    },
    
    image:{
        type:String,
        required:true
    },
    
    isAvailable:{
        type:Boolean,
        default:true
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    }
},{timestamps:true})

export const Menu = mongoose.model("Menu",menuSchema)