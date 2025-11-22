import mongoose,{Document} from "mongoose";

export interface Irestaurant{
    user:mongoose.Schema.Types.ObjectId
    restaurantname:string
    city:string
    country:string
    deliverytime:number
    cuisines:string[]
    imageUrl:string
    menus:mongoose.Schema.Types.ObjectId[]
    status: 'open' | 'closed'
    likes: mongoose.Schema.Types.ObjectId[]
    rating?: number
}

export interface IrestaurantDocument extends Irestaurant,Document{
    createdAt:Date
    updatedAt:Date
}

const restaurantSchema = new mongoose.Schema<Irestaurant>({ 
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    restaurantname:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    country:{
        type:String,
        required:true
    },
    deliverytime:{
        type:Number,
        required:true
    },
    cuisines:[{
        type:String,
        required:true
    }],
    menus:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Menu"
    }],
    imageUrl:{
        type:String,
        required:true
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    }
},{timestamps:true})

export const Restaurant = mongoose.model("Restaurant",restaurantSchema)