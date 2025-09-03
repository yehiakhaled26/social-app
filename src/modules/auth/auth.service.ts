

import type { Request, Response } from "express";
import { IConfirmEmailBodyInputsDTto, ISignupBodyInputsDTto , ILoginBodyInputsDTto, IGmail, IForgetCodeBodyInputsDTto, IVerifyForgetPasswordBodyInputsDTto, IResetForgetPasswordBodyInputsDTto } from "./dto/auth.dto";

import {  providerEnum, UserModel } from "../../DB/model/User.model";
import { BadRequest, confilctException } from "../../utils/response/error.response";
import { UserRepository } from "../../DB/repository/user.repository";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { generateNumberOtp } from "../../utils/security/otp";
import { emailEvent } from "../../utils/event/email.event";
import { createLoginCredentials } from "../../utils/security/token.security";
import {OAuth2Client, TokenPayload} from 'google-auth-library';


export class AuthenticationService {
  private userModel = new UserRepository(UserModel);
  constructor() {}

  private async verifyGmailAccount (idToken:string):Promise<TokenPayload> {
    const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.WEB_CLIENT_ID?.split(",") || []
  });
  const payload = ticket.getPayload();

  if (!payload?.email_verified) {
    throw new BadRequest("Gmail account not verified");
  }
return payload;
}


loginWithGmail = async (req:Request , res:Response): Promise<Response> => {

  const {idToken}: IGmail = req.body;
  const {email } = await this.verifyGmailAccount(idToken);

   const user = await this.userModel.findOne({
    filter: { email ,
    provider: providerEnum.GOOGLE },
   });

   if (!user){
    throw new BadRequest(
      "No Register Account ");
    }

const credentials = await createLoginCredentials(user);

    return res.json({ message: "success" , data:{credentials}});
  };



signupWithGmail = async (req:Request , res:Response): Promise<Response> => {

  const {idToken}: IGmail = req.body;
  const {email , family_name , given_name , picture }:TokenPayload =
   await this.verifyGmailAccount(idToken);

   const user = await this.userModel.findOne({
    filter: { email },
   });

   if (user) {
    if(user.provider === providerEnum.GOOGLE){

      return await this.loginWithGmail(req , res);
    }
    throw new confilctException(`Email already exist ::: ${user.provider}`);
   }

   const [newUser] = ( await this.userModel.create({
  data: [{
    firstName: given_name as string,
    lastName: family_name as string,
    email: email as string,
    profileImage: picture as string,
    ConfirmedAt: new Date(), 
    provider: providerEnum.GOOGLE,
  }],
})) || [];

if (!newUser) {
  throw new BadRequest("User not created");
}

const credentials = await createLoginCredentials(newUser);

    return res.status(201).json({ message: "success" , data:{credentials}});
  };

  





  signup = async (req: Request, res: Response): Promise<Response> => {
    let { username, email, password }: ISignupBodyInputsDTto = req.body;
    console.log({ username, email, password });

    
   

   const checkUserExist = await this.userModel.findOne({
    filter: { email },
    select: "email",
    options: {lean:false,
    // populate: [{path:"username"}]
    },
   });
   console.log(checkUserExist);

  if (checkUserExist?._id) {
    throw new confilctException("Email already exist");
  }

  const otp = generateNumberOtp();

  const user = await this.userModel.createUser({
      data: [{ username, email, password: await generateHash(password) , ConfirmEmailOtp: await generateHash(String(otp)) }],
      options: {},
    });
   

 
emailEvent.emit("confirmEmail",{to: email, otp });

return res.status(201).json({ message: "success", data: {user}
});


  };

  confirmEmail = async (req: Request, res: Response) : Promise<Response> => {

    const {email, otp}: IConfirmEmailBodyInputsDTto = req.body;

   const user = await this.userModel.findOne({
    filter: { email ,
       ConfirmEmailOtp:{$exists: true} ,
     ConfirmedAt:{$exists: false}},
 
   });
      if (!user) {
        throw new BadRequest  ("invalid account");
      }
      if(!await compareHash(otp , user.ConfirmEmailOtp as string)){
        throw new BadRequest("invalid otp");
      }

      await this.userModel.updateOne({
        filter: { email},
        update: { ConfirmedAt: new Date() ,
                 $unset:{ConfirmEmailOtp:1} 
        },
      });




    return res.status(200).json({ message: "success" });
  };

    login = async (req: Request, res: Response): Promise<Response> => {

      const { email, password }: ILoginBodyInputsDTto = req.body;
    
      const user = await this.userModel.findOne({
      filter: { email , provider:providerEnum.SYSTEM},
        });


      if (!user) {
        throw new BadRequest("invalid account");
      };

      if (!user.ConfirmedAt) {
        throw new BadRequest("please confirm your email");
      }

      if (!compareHash(password, user.password as string)) {
        throw new BadRequest("invalid account");
      }

      const Credentials = await createLoginCredentials(user);
   

       return res.status(200).json({ message: "success",data:{Credentials }


      });
    };

    sendForgetCode = async (req: Request, res: Response): Promise<Response> => {

      const { email }: IForgetCodeBodyInputsDTto = req.body;
    
      const user = await this.userModel.findOne({
      filter: { email , provider:providerEnum.SYSTEM , ConfirmedAt:{$exists: true} },
        });


      if (!user) {
        throw new BadRequest("invalid account due to one of following reason");
      };


      const otp = generateNumberOtp();
      const result =   await this.userModel.updateOne({
        filter: { email },
        update: { resetPasswordOtp: await generateHash(String(otp)) },
      });  

      if (!result.modifiedCount) {
        throw new BadRequest("fail to send code");
      }
        
    
       emailEvent.emit("resetPassword", {to: email, otp});
       return res.status(200).json({ message: "success"})


      };



        verifyForgetCode = async (req: Request, res: Response): Promise<Response> => {

      const { email , otp }: IVerifyForgetPasswordBodyInputsDTto = req.body;
    
      const user = await this.userModel.findOne({
      filter: { email , provider:providerEnum.SYSTEM ,
        resetPasswordOtp:{$exists: true} },
        });


      if (!user) {
        throw new BadRequest("invalid account due to one of following reason");
      };

      if (!await compareHash(otp , user.resetPasswordOtp as string)){ {
        throw new confilctException("invalid otp");
      }
    }

       return res.json({ message: "success"})
      };


      resetForgetCode = async (req: Request, res: Response): Promise<Response> => {

      const { email , otp , password }: IResetForgetPasswordBodyInputsDTto = req.body;
    
      const user = await this.userModel.findOne({
      filter: { email , provider:providerEnum.SYSTEM ,
        resetPasswordOtp:{$exists: true} },
        });


      if (!user) {
        throw new BadRequest("invalid account due to one of following reason");
      };

      if (!await compareHash(otp , user.resetPasswordOtp as string)){ 
        throw new confilctException("invalid otp");
      
    }

   const result = await this.userModel.updateOne({
        filter: { email },
        update: {
          password: await generateHash(password),
          changeCerdentialsTime: new Date(),
          $unset: { resetPasswordOtp: 1 },
        },
        },
      );
      
    

  if (!result.matchedCount) {
    throw new BadRequest("fail to resent password");
}
      
       return res.json({ message: "success"})
      };

    };

export  default new AuthenticationService();
 