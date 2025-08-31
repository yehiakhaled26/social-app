

import type { Request, Response } from "express";
import { IConfirmEmailBodyInputsDTto, ISignupBodyInputsDTto } from "./dto/auth.dto";

import {  UserModel } from "../../DB/model/User.model";
import { BadRequest, confilctException } from "../../utils/response/error.response";
import { UserRepository } from "../../DB/repository/user.repository";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { generateNumberOtp } from "../../utils/otp";
import { emailEvent } from "../../utils/event/email.event";




export class AuthenticationService {
  private userModel = new UserRepository(UserModel);


  constructor() {}

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

    login = (req: Request, res: Response): Response  => {

   return res.status(200).json({ message: "success",data: req.body });
    }
}


export default new AuthenticationService();
 