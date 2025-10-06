
import { DatabaseRepository } from "./database.repository";
import {IPost as TDocument} from "../model/post.model";
// import { Types } from "mongoose";
// import { Model } from "mongoose";

export class PostRepository extends DatabaseRepository<TDocument> 
{}
//   findOneAndUpdate({ filter: { _id: string } ,update: { $push: any } },  { likes: Types.ObjectId | undefined; }, arg0: { filter: { _id: string; }; data: { $addToSet: { likes: Types.ObjectId | undefined; }; }; options: { new: boolean; }; }) {
//     throw new Error("Method not implemented.");
//   }
// }
//     deleteMany(arg0: { filter: { userId: any; }; }) {
//         throw new Error("Method not implemented.");
//     }
//     constructor (protected override readonly model:Model<TDocument>){
//         super(model);
//     }   
