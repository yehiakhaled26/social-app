

import { Request, Response} from "express";
import { ILogoutDto } from "./user.dto";
import { createLoginCredentials, createRevokeToken, logoutEnum } from "../../utils/security/token.security";
import { HUserDocument, IUser } from "../../DB/model/User.model";
import { UserRepository } from "../../DB/repository/user.repository";
import { UserModel } from "../../DB/model/User.model";
import { UpdateQuery } from "mongoose";
import { TokenRepository} from "../../DB/repository/token.repository";
import { TokenModel  } from "../../DB/model/Token.model";
import { JwtPayload } from "jsonwebtoken";



class UserService {
    private userModel = new UserRepository(UserModel);
    private tokenModel = new TokenRepository(TokenModel);

    constructor() {}

    Profile = async (req: Request, res: Response): Promise<Response> => {
        return res.json({ message: "success", data:
            { user: req.user?._id , 
            decoded:req.decoded?.iat,
     },
     });
    }


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

    await this.userModel.updateOne({
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
    return res.status(201).json({
        message: "success",
        data: credentials
    })

  }
 }

    export default new UserService();