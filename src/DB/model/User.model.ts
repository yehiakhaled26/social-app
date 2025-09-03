


import {Types , Schema , HydratedDocument}  from "mongoose";
import {models , model} from "mongoose";



export enum RoleEnum {
    User = "User",
    Admin = "Admin",
    
}

export enum genderEnum {
    male = "male",
    female = "female",
}   

export enum providerEnum {
    GOOGLE = "GOOGLE",
    SYSTEM = "SYSTEM",
}   


export interface IUser {
    _id: Types.ObjectId;

    firstName: string;
    lastName: string;
    username?: string;

    email: string;
    ConfirmEmailOtp?: string;
    ConfirmedAt?: Date;

    password: string;
    resetPasswordOtp?: string;
    changeCerdentialsTime?: Date;

    phone?: string;
    address?: string;
    profileImage?: string;
    coverImage?: string[];

    gender:genderEnum;
    role: RoleEnum;

    provider: providerEnum;
    

    createdAt: Date;
    updatedAt?: Date;
}




const userSchema = new Schema<IUser>(
    {

    firstName: { type: String, required: true , min:2 , max:25 },
    lastName: { type: String, required: true , min:2 , max:25 },
  

    email: { type: String, required: true, unique: true },
    ConfirmEmailOtp: { type: String },
    ConfirmedAt: { type: Date },

    password: { type: String, required: function (){
        return this.provider === providerEnum.GOOGLE ? false : true 
    }},
    resetPasswordOtp: { type: String, required: false },
    changeCerdentialsTime: Date,

    phone: { type: String },
    address: { type: String },

    profileImage: {type: String},
    coverImage: [String],
    gender: {type: String, enum: genderEnum, default: genderEnum.male},
    role: { type: String, enum: RoleEnum, default: RoleEnum.User },
    provider: { type: String, enum: providerEnum, default: providerEnum.SYSTEM},

   
    
}, {
    timestamps: true,
    toJSON: { virtuals: true},
    toObject: { virtuals: true },
   
}
);

userSchema.virtual("username").set(function (value: string) {
    const [firstName, lastName] = value.split(" ") || []; 
    this.set ({firstName , lastName});
    
}).get(function () {
    return this.firstName + " " + this.lastName ;
});


export const UserModel = models.User || model<IUser>("User", userSchema);

export type HUserDocument = HydratedDocument<IUser>;

