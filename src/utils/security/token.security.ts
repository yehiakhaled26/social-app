

import {v4 as uuidv4} from "uuid"
import type {JwtPayload, Secret , SignOptions} from "jsonwebtoken"
import { sign } from "jsonwebtoken";
import { HUserDocument, RoleEnum, UserModel } from "../../DB/model/User.model";
import { verify } from "jsonwebtoken";
import { BadRequest, unauthorized } from "../response/error.response";
import { UserRepository } from "../../DB/repository/user.repository";
import { TokenRepository } from "../../DB/repository/token.repository";
import { HTokenDocument, TokenModel } from "../../DB/model/Token.model";



export enum SignatureLevelEnum {
    bearer="bearer",
    system="system",
}

export enum TokenEnum {
    access="access",
    refresh="refresh",
}

export enum logoutEnum {
    only="only",
    all="all",
}

export const generateToken = async ({
   payload,
   secret = process.env.USER_TOKEN_SIGNATURE as Secret ,
   options = {expiresIn:Number(process.env.ACCESS_TOKEN_EXPIRES_IN)},
} :
{payload : object ,
     secret?: Secret ,
      options? : SignOptions }) =>{


    return sign(payload, secret, options);
};

export const verifyToken = async ({
   token,
   secret = process.env.USER_TOKEN_SIGNATURE as string ,
} :
    { token : string ;
     secret?: Secret ;
    }):Promise<JwtPayload> => {
          return verify(token, secret)as JwtPayload;
};



export const getSignatures = async (signatureLevel:SignatureLevelEnum = SignatureLevelEnum.bearer): Promise<{access_signature: string ; refresh_signature: string}> => {
   let Signatures : {access_signature: string ; refresh_signature: string} = {access_signature: "" , refresh_signature: "" }; 

   switch (signatureLevel) {
    case SignatureLevelEnum.system:
        Signatures.access_signature = process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE as string;
        Signatures.refresh_signature = process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE as string;
        break;
    default:
         Signatures.access_signature = process.env.ACCESS_USER_TOKEN_SIGNATURE as string;
        Signatures.refresh_signature = process.env.REFRESH_USER_TOKEN_SIGNATURE as string;
        break;
   }
    return Signatures;
}


export const detectSignatureLevel = async (role:RoleEnum = RoleEnum.User): Promise<SignatureLevelEnum> => {
   let SignatureLevel :SignatureLevelEnum = SignatureLevelEnum.bearer; 

   switch (role) {
    case RoleEnum.Admin:
        SignatureLevel = SignatureLevelEnum.system;
        break;
    default:
    
        SignatureLevel = SignatureLevelEnum.bearer;
        break;
   }
    return SignatureLevel;
}

export const createLoginCredentials = async (user:HUserDocument)=> {
    const signatureLevel = await detectSignatureLevel(user.role);
    const Signatures = await getSignatures(signatureLevel);
console.log(Signatures);

const jwtid = uuidv4();

    const access_token = await generateToken({
        payload: {_id: user._id},
        secret: Signatures.access_signature ,
        options: {expiresIn:Number(process.env.ACCESS_TOKEN_EXPIRES_IN , 
         
        ), jwtid
        }
      });

      const refresh_token = await generateToken({
        payload: {_id: user._id},
        secret: Signatures.refresh_signature ,
        options: {expiresIn:Number(process.env.REFRESH_TOKEN_EXPIRES_IN , 
        ), jwtid
      
    }
      });

      return {access_token , refresh_token};
}


export const decodeToken = async ({authorization , tokenType = TokenEnum.access}
    :{authorization: string ; tokenType?: TokenEnum}) => {


     const userModel = new UserRepository(UserModel);
     const tokenModel = new TokenRepository(TokenModel);

    const [bearerKey, token] = authorization.split(" ") ;
    if (!bearerKey || !token) {
        throw new unauthorized("missing token parts");
    }
   const Signatures = await getSignatures(bearerKey as SignatureLevelEnum);
   const decoded = await verifyToken({
    token, secret: tokenType === TokenEnum.refresh ? Signatures.refresh_signature : Signatures.access_signature});
   

if (!decoded?._id || !decoded?.iat ) {
    throw new BadRequest("invalid token");
}

if (await tokenModel.findOne({filter:{jti:decoded.jti}})) {
 throw new unauthorized("invalid login credentials");    
}


const user = await userModel.findOne({ filter : {_id: decoded._id}  });
if (!user) {
    throw new BadRequest("user not found");

}
    
if ((user.changeCerdentialsTime?.getTime() || 0) > decoded.iat * 1000 ) {
  throw new unauthorized("invalid login credentials");    
}



return {user , decoded};
}


export const createRevokeToken = async (decoded : JwtPayload):Promise<HTokenDocument> => {
    const  tokenModel = new TokenRepository(TokenModel);
   const [result] = ( await tokenModel.create({
        data :[{
            jti: decoded?.jti as string, 
            expiresIn:
            ( decoded?.iat as number) + 
            Number( process.env.REFRESH_TOKEN_EXPIRES_IN) ,
            userId: decoded?._id,
        },
        ],
    })) || [];

    if (!result) {
        throw new BadRequest("error in create revoke token");
    }
    return result;
};