import { HydratedDocument, model, models, Schema, Types } from "mongoose";


export enum AllowCommentsEnum {
    allow="allow" , 
    deny="deny" ,
}

export enum AvailabilityEnum {
    public ="public" , 
    friends ="friends" ,
    onlyMe = "only-me"
}

export enum LikeActionEnum {
    like = "like",
    unlike = "unlike"
}

export interface IPost {
    content?: string;
    attachments?: string[];
    assetsFolderId: string;

    allowComments: AllowCommentsEnum;
    availability: AvailabilityEnum;

    tags?:Types.ObjectId[];
    likes?:Types.ObjectId[];

    createdBy: Types.ObjectId;

    freezedBy?:Types.ObjectId;
    freezedAt?:Date;

    restoredBy?:Types.ObjectId;
    restoredAt?:Date;

    createdAt:Date;
    updatedAt?:Date;
}

export type HPostDocument = HydratedDocument<IPost>;

const postSchema = new Schema<IPost>({
    content: {types:String , minLength:2 , maxlength:500000 , required:function (){
        return !this.attachments?.length
    }},
    attachments: [String],
    assetsFolderId: {type:String , required:true},

    allowComments: {type:String , enum:AllowCommentsEnum , default:AllowCommentsEnum.allow},
    availability: {type:String , enum:AvailabilityEnum , default:AvailabilityEnum.public},

    tags: [{type:Schema.Types.ObjectId ,ref:"user"}],
    likes: [{type:Schema.Types.ObjectId ,ref:"user"}],
 
    createdBy: {type: Schema.Types.ObjectId ,ref:"user" , required: true },

    freezedBy: {type: Schema.Types.ObjectId ,ref:"user"},
    freezedAt: Date,

    restoredBy: {type: Schema.Types.ObjectId ,ref:"user"},
    restoredAt: Date,
}
,{
    timestamps:true,
    strictQuery:true,
});

postSchema.pre(["findOneAndUpdate" , "updateOne"] , function (next){
       const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({...query});
    } else {
         this.setQuery({...query , freezedAt:{$exists:false} } );
    }
    next()
}
);
export const PostModel = models.post || model<IPost>("post",postSchema)