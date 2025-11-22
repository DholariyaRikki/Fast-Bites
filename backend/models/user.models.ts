import mongoose,{Document} from "mongoose";
import crypto from "crypto";

export interface IUser{
    fullname:string
    email:string
    password:string
    contact:string
    address:string
    city:string
    country:string
    profilePicture:string
    admin:boolean
    delivery:boolean
    superAdmin:boolean
    lastlogin?:Date
    isverified?:boolean
    resetpasswordtoken?:string
    resetpasswordtokenexpire?:Date
    verificationtoken?:string
    verificationtokenexpireat?:Date
}

// export interface
export interface IUserDocument extends IUser, Document{
    createdAt:Date,
    updatedAt:Date
}

// user schema
const userSchema = new mongoose.Schema<IUserDocument>({
    fullname:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    contact:{
        type:String,
        required:true
    },
    address:{
        type:String,
        default:"update your address"
    },
    city:{
        type:String,
        default:"update your city"
    },
    country:{
        type:String,
        default:"update your country"
    },
    profilePicture:{
        type:String,
        default:""
    },
    admin:{
        type:Boolean,
        default:false
    },
    delivery:{
        type:Boolean,
        default:false
    },
    superAdmin:{
        type:Boolean,
        default:false
    },
    lastlogin:{
        type:Date,
        default:Date.now
    },
    isverified:{
        type:Boolean,
        default:false
    },
    resetpasswordtoken:String,
    resetpasswordtokenexpire:Date,
    verificationtoken:String,
    verificationtokenexpireat:Date

},{timestamps:true})

// Add the generateResetToken method to the schema
userSchema.methods.generateResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.resetpasswordtoken = resetToken;
    this.resetpasswordtokenexpire = Date.now() + 3600000;
    return resetToken;
};

// user model
export const User = mongoose.model("User",userSchema)