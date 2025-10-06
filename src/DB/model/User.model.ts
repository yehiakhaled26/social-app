


import {Types , Schema , HydratedDocument}  from "mongoose";
import {models , model} from "mongoose";

import { generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../utils/event/email.event";

import { BadRequest } from "../../utils/response/error.response";
// import { generateHash } from "../../utils/security/hash.security";
// import { emailEvent } from "../../utils/event/email.event";





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

export enum enableTwoStepVerificationEnum {
    email = "email",
    sms = "sms",
    
}



export interface IUser {
    _id: Types.ObjectId;

    
    firstName: string;
    lastName: string;
    username?: string;
    slug:string;

    email: string;
    ConfirmEmailOtp?: string;
    ConfirmedAt?: Date;

    password: string;
    resetPasswordOtp?: string;
    changeCerdentialsTime?: Date;

    phone?: string;
    address?: string;


    profileImage?: string;
    temProfileImage?: string;
    coverImage?: string[];

    gender:genderEnum;
    role: RoleEnum;

    provider: providerEnum;
    

    createdAt: Date;
    updatedAt?: Date;
    freezedAt?: Date;
    freezedBy?: Types.ObjectId;
    restoredAt?: Date;
    restoredBy?: Types.ObjectId;
 
    extra:{
        name:String;

    }
}

// export type HUserDocument = HydratedDocument<IUser>;



const userSchema = new Schema<IUser>(
    {

    firstName: { type: String, required: true , min:2 , max:25 },
    lastName: { type: String, required: true , min:2 , max:25 },
     slug: { type: String, required: true , min:5 , max:51 },


  

    email: { type: String, required: true, unique: true },
    ConfirmEmailOtp: { type: String },
    ConfirmedAt: { type: Date },
    freezedAt: Date ,
    freezedBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date ,
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },

    password: { type: String, required: function (){
        return this.provider === providerEnum.GOOGLE ? false : true 
    }},
    resetPasswordOtp: { type: String, required: false },
    changeCerdentialsTime: Date,

    phone: { type: String },
    address: { type: String },

    profileImage: String,
    temProfileImage:  String,
    coverImage: [String],


    gender: {type: String, enum: genderEnum, default: genderEnum.male},
    role: { type: String, enum: RoleEnum, default: RoleEnum.User },
    provider: { type: String, enum: providerEnum, default: providerEnum.SYSTEM},

   
    
}, {
    strictQuery:true,
    timestamps: true,
    toJSON: { virtuals: true},
    toObject: { virtuals: true },
   
}
);

userSchema.virtual("username").set(function (value: string) {
    const [firstName, lastName] = value.split(" ") || []; 
    this.set ({firstName , lastName , slug : value.replaceAll(/\s+/g,"-")});
    
}).get(function () {
    return this.firstName + " " + this.lastName ;
});

userSchema.pre("save" , async function(this:HUserDocument & {wasNew:boolean , ConfirmEmailPlainOtp?:string },next){
    this.wasNew = this.isNew
    if (this.isModified("password")) {
        this.password = await generateHash(this.password)
    }

       if (this.isModified("confirmEmailOtp")) {
        this.ConfirmEmailPlainOtp = this.ConfirmEmailOtp as string;
        this.ConfirmEmailOtp = await generateHash(this.ConfirmEmailOtp as string)
    }
    next()
})

userSchema.post("save" , async function (doc , next){
const that = this as HUserDocument & { wasNew:boolean ,
     ConfirmEmailPlainOtp?:string };

if (that.wasNew && that.ConfirmEmailPlainOtp){
    emailEvent.emit("confirmEmail" , {to:this.email ,
         otp:that.ConfirmEmailPlainOtp ,

})
}

    next();
})

// userSchema.pre("updateOne" ,async function (next) {
//     const query = this.getQuery();
//     const update = this.getUpdate() as UpdateQuery<HUserDocument>;

//     if (update.freezedAt){
//         this.setUpdate({...update , changeCredentialsTime:new Date()})
//     }
   
    
//     console.log({query ,  update});
//     next ();
    
// });


// userSchema.post("updateOne" ,async function (next) {
//     const query = this.getQuery();
//     const update = this.getUpdate() as UpdateQuery<HUserDocument>;
    
//     if (update["$set"].changeCredentialsTime) {
//         const tokenModel = new TokenRepository(TokenModel);
//         await tokenModel.deleteMany({filter:{userId: query._id
//         }})
//     }
    
//     console.log({query ,  update: update["$set"].changeCredentialsTime  });
    
    
// });


// userSchema.post(["deleteOne" , "findOneAndDelete"]  , async function (doc ,next) {
//     console.log({this:this});
    
//      const query = this.getQuery();
//     const tokenModel = new TokenRepository(TokenModel);
//         await tokenModel.deleteMany({filter:{userId: query._id
//         }})
    
// })


// userSchema.pre(["findOneAndUpdate" , "updateOne"] , async function (next) {
//     console.log({this : this});
//     next ();
    
// }
// )
// userSchema.post(["findOneAndUpdate" , "updateOne"] , async function (doc ,next) {
//     console.log({this : this});
//     next ();
    
// }
// )


userSchema.pre("validate" , function ( next){
    console.log( {pre_validate:this });
      if (!this.slug?.includes("-")){
        return next( new BadRequest("slug is required"))
    }
    next();
})  

// userSchema.pre("save" , async function (this :HUserDocument &{wasNew :boolean}  , next ) {
//     this.wasNew =this.isNew || this.isModified("email")

//     console.log( {pre_save:this ,
//                  password:this.isModified("password") ,
//                  modifiedPaths: this.modifiedPaths() ,
//                  new : this.isNew ,
//                  directPaths: this.directModifiedPaths() ,
//                  isdirectPaths: this.isDirectModified("extra") ,
//                  selected : this.isSelected("extra") ,
//                  directSelected: this .isDirectSelected("extra.name") ,
//                  isLastNameInit: this.isInit("lastName"),
//                  isGenderInit : this.isInit("male")
//                 });
//     if (this.isModified("password")){
//         this.password = await generateHash(this.password)
//     }

//     next();
// })

// userSchema.post("save" , function (doc , next){
//     const that = this as HUserDocument &{wasNew :boolean} 
//     console.log( {post_save:this , doc , new : that.wasNew});
//     if (that.wasNew){
//          emailEvent.emit("confirmedEmail", {to :this.email , otp:123456})
//     }
//     emailEvent.emit("confirmedEmail", {to :this.email , otp:123456})

//     next();
// })


// userSchema.pre("init" , function (doc){
//     console.log(doc);
//     console.log(this); 
    
// })

// userSchema.pre(["find" , "findOne"] , function (next) {
//     const query = this.getQuery();

//     console.log({this:this , query ,options :this.getOptions() });
//     this.setOptions({lean:false});

//     if (query.paranoid === false){
//         this.setQuery({ ...query});
//     } else {
//         this.setQuery({...query , freezedAt:{$exists:false}});
//     }

//     this.populate([{path:"freezedBy"}])
//     console.log({fQ:this.getQuery() });  
    
//     next()
    
// })

// userSchema.pre("insertMany" , async function(next , docs){
//     console.log({this:this , docs});
//     for(const doc of docs){
//         doc.password = await generateHash(doc.password)
//     }
    
// })


userSchema.pre(["find" , "findOne"] , function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({...query});
    } else {
         this.setQuery({...query , freezedAt:{$exists:false} } );
    }
    next();
})
export const UserModel = models.User || model<IUser>("User", userSchema);

export type HUserDocument = HydratedDocument<IUser>;

  