



export interface ISignupBodyInputsDTto {
  username: string; 
    email: string;
    password: string;
    phone: string;
}

import * as validators from "../auth.validation"
import { z } from "zod";



export type SignupBodyInputsDTto = z.infer<typeof validators.signup.body>;
export type IConfirmEmailBodyInputsDTto = z.infer<typeof validators.confirmEmail.body>;