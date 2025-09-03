



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
export type ILoginBodyInputsDTto = z.infer<typeof validators.login.body>;
export type IVerifyForgetPasswordBodyInputsDTto = z.infer<typeof validators.verifyForgetPassword.body>;
export type IResetForgetPasswordBodyInputsDTto = z.infer<typeof validators.ResetForgetPassword.body>;
export type IGmail = z.infer<typeof validators.signupWithGmail.body>;
export type IForgetCodeBodyInputsDTto = z.infer<typeof validators.sendForgetPasswordCode.body>;