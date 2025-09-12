

import { Request, Response} from "express";
import { IFreezeAccountDto, IHardDeleteAccountDto, ILogoutDto, IRestoreAccountDto } from "./user.dto";
import { createLoginCredentials, createRevokeToken, logoutEnum } from "../../utils/security/token.security";
import { HUserDocument, IUser, RoleEnum } from "../../DB/model/User.model";
import { UserRepository } from "../../DB/repository/user.repository";
import { UserModel } from "../../DB/model/User.model";
import { UpdateQuery } from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import { StorageEnum } from "../../utils/multer/cloud.multer";
import {  createPreSignedUpLoadLink, deleteFiles, deleteFolderByPrefix, uploadFiles } from "../../utils/multer/s3.config";
import { Types } from "mongoose";
import { BadRequest, ForbiddenException, unauthorized } from "../../utils/response/error.response";
import { s3Event } from "../../utils/multer/s3.event";
import { successResponse } from "../../utils/response/success.response";
import { IProfileImageResponse, IUserResponse } from "./user.entities";
import { ILoginResponse } from "../auth/auth.entities";



class UserService {
    private userModel = new UserRepository(UserModel);
    // private tokenModel = new TokenRepository(TokenModel);

    constructor() {}

Profile = async (req: Request, res: Response): Promise<Response> => {
      if (!req.user) {
        throw new unauthorized("missing user details")
      }
        return successResponse<IUserResponse>({res , data:{user : req.user } })
};
    
freezeAccount = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params as IFreezeAccountDto || {};
  if (userId && req.user?.role !== RoleEnum.Admin) {
    throw new ForbiddenException("not authorized user");
  }

  const user = await this.userModel.UpdateOne({
  filter : {
    _id: userId || req.user?._id,
    freezedAt: { $exists: false }, 
  },
  update : {
    freezedAt : new Date(),
    freezedBy : req.user?._id,
    changeCredentialsTime : new Date(),
    $unset:{
        restoredAt :1 ,
        restoredBy :1
    }
  }
  });

if (!user.matchedCount){
    throw new BadRequest("fail to update user")
}
  return successResponse({res})
};

restoreAccount = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params as IRestoreAccountDto ;
  if (userId && req.user?.role !== RoleEnum.Admin) {
    throw new ForbiddenException("not authorized user");
  }

  const user = await this.userModel.UpdateOne({
  filter : {
    _id: userId ,
    freezedBy: { $ne: userId }, 
  },
  update : {
    restoredAt : new Date(),
    restoredBy : req.user?._id,
    changeCredentialsTime : new Date(),
    $unset:{
        freezedAt :1 ,
        freezedBy :1
    }
  }
  });

if (!user.matchedCount){
    throw new BadRequest("fail to restore user")
}
  return res.json({ message: "Done", data: user });
};

hardDeleteAccount = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params as IHardDeleteAccountDto ;
  if (userId && req.user?.role !== RoleEnum.Admin) {
    throw new ForbiddenException("not authorized user");
  }

  const user = await this.userModel.DeleteOne({
  filter : {
    _id: userId ,
    freezedAt: { $exists: true }, 
  },
  update : {
    restoredAt : new Date(),
    restoredBy : req.user?._id,
    changeCredentialsTime : new Date(),
    $unset:{
        freezedAt :1 ,
        freezedBy :1
    }
  }
  });

if (!user.deletedCount){
    throw new BadRequest("user not found or hard delete e user")
}
 await deleteFolderByPrefix ({path : `users/${userId}`})
  return res.json({ message: "Done", data: user });
};

profileImage = async (req: Request, res: Response): Promise<Response> => {

    //     const Key = await uploadLargeFile({
    //         storageApproach: StorageEnum.disk,
    //         file: req.file as Express.Multer.File,
    //         path: `users/${req.decoded?._id}`,
    //     });
    //     return res.json({ message: "success",
    //      data:{
    //        Key,}
    //  });
    // };

    const {ContentType , originalname}:{ContentType : string , originalname : string} = req.body;
    const {url , Key } = await createPreSignedUpLoadLink({ ContentType , originalname , path : `users/${req.decoded?._id}`,});

    const user = await this.userModel.findByIdAndUpdate({
        id : req.user?._id as Types.ObjectId,
        update : {
            profileImage : Key ,
            temProfileImage : req.user?.profileImage
        }
        
    })
        if (!user){
         throw new BadRequest("fail to update user image")
    } 

    s3Event.emit("trackProfileImageUpload" , {
       userId : req.user?._id ,
       oldKey : req.user?.profileImage ,
        Key ,
        expiresIn:30000
    })
    return successResponse<IProfileImageResponse>({res , data :{ url}
})
};

profileCoverImage = async (req: Request, res: Response): Promise<Response> => {
        const urls = await uploadFiles({
            storageApproach: StorageEnum.disk,
            files: req.files as Express.Multer.File[],
            path: `users/${req.decoded?._id}/cover`,
            userLarge: true
        });

        const  user = await this.userModel.findByIdAndUpdate({
            id : req.user?._id as Types.ObjectId,
            update : {
                coverImage : urls ,
            
            }
        })
           if (!user){
             throw new BadRequest("fail to update user image")
        }
        if (req.user?.coverImage){
            await deleteFiles({urls : req.user?.coverImage});
        }
        return successResponse<IUserResponse>({res , data:{user} })
     
};

logout = async (req: Request, res: Response): Promise<Response> => {
     const {flag}: ILogoutDto = req.body;

     let statusCode : number = 200;

     const update: UpdateQuery<IUser>  = {};
switch (flag) {
    case logoutEnum.all:
        update.changeCredentialsTime = new Date();
        
        break;

    default:
       await createRevokeToken(req.decoded as JwtPayload);
        statusCode=201
        break;
}

    await this.userModel.UpdateOne({
        filter: {_id: req.decoded?._id},
        update,
        
    })

     return res.status(statusCode).json({
        message: "success",
        data:{
            user: req.user?._id,
            decoded:req.decoded?.iat,
            
        }
     })
};

refreshToken = async (req: Request, res: Response): Promise<Response> => {
    const credentials = await createLoginCredentials(req.user as HUserDocument);
    await createRevokeToken(req.decoded as JwtPayload);
    return successResponse<ILoginResponse>({res ,statusCode:201 , data:{credentials} })

};

}

    export default new UserService();



