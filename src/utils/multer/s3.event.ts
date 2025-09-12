

import { EventEmitter } from "node:events";
import { deleteFile, getFile } from "./s3.config";
import { UserRepository } from "../../DB/repository/user.repository";
import { UserModel } from "../../DB/model/User.model";

export const s3Event = new EventEmitter();

s3Event.on("trackProfileImageUpload", (data) => {
    console.log( data);

    setTimeout(async () => {
        const userModel = new UserRepository(UserModel);
        try {
            await getFile({ Key: data.Key });
             await userModel.UpdateOne({
                filter: { _id: data.userId },
                update: { $unset:{temProfileImage :1}},
            }); 
            await deleteFile({ Key: data.oldKey });
            console.log("File uploaded successfully");
        } catch (error : any) {
            console.log(error);
            if (error.code === "NoSuchKey") {
           await userModel.UpdateOne({
                filter: { _id: data.userId },
                update:{ profileImage: data.oldKey, 
                 $unset:{temProfileImage :1}
                }
            });
        }
    }
    }, data.expiresIn || Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS) * 1000);
});    
    