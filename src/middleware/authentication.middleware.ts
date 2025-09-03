
import { JwtPayload } from "jsonwebtoken";
import { HUserDocument, RoleEnum } from "../DB/model/User.model";
import { decodeToken, TokenEnum } from "../utils/security/token.security";
import { NextFunction, Request, Response } from "express";
import { BadRequest, ForbiddenException } from "../utils/response/error.response";

interface IAuthReq extends Request {
    user?: HUserDocument;
    decoded?: JwtPayload;
}

import { RequestHandler } from "express";

export const authentication = (tokenType: TokenEnum = TokenEnum.access): RequestHandler => {

  return async (req: IAuthReq, res: Response, next: NextFunction): Promise<void> => {
    if (!req.headers.authorization) {
      throw new BadRequest("unauthorized", {
        key: "headers",
        issue: [{ path: "authorization", message: "missing unauthorized" }],
      });
    }

    const { decoded, user } = await decodeToken({
      authorization: req.headers.authorization,
      tokenType,
    });

    req.user = user;
    req.decoded = decoded;
    next();
  };
};
// export const authentication = (tokenType: TokenEnum = TokenEnum.access ) => {

//     return async (req:IAuthReq , res:Response , next:NextFunction) => {


//         if (!req.headers.authorization) {
//             throw new BadRequest("unauthorized" , { 
//                 key:"headers"  ,
//                  issue:[{path:"authorization" ,
//                  message:"missing unauthorized"}],
//             });
//         }

//         const { decoded , user} = await decodeToken({
//             authorization: req.headers.authorization,
//         tokenType,
//     });
    

//       req.user = user;
//       req.decoded = decoded;
//      next();

//     };
// };

export const authorization = (
    accessRoles: RoleEnum[] = [] ,
    tokenType: TokenEnum = TokenEnum.access) => {
    return async (req:Request , res:Response , next:NextFunction) => {

   if (!req.headers.authorization) {
    throw new BadRequest("unauthorized" , { 
        key:"headers"  ,
         issue:[{path:"authorization" ,
         message:"missing unauthorized"}],
    });
}
    const { decoded , user} = await decodeToken({
        authorization: req.headers.authorization,
    tokenType,
});

if (!accessRoles.includes(user.role)) {
    throw new ForbiddenException("No Autherized account");
}


req.user = user;
req.decoded = decoded;
 next();
    };
};

