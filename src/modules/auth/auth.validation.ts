
import {z} from "zod";  
import { generalFields } from "../../middleware/validation.middleware";



export const signup = {
 
    body: z.strictObject({
        username:   generalFields.username ,
        email:   z.email(), 
        password:   z.string().regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/ ),
      confirmPassword:   z.string(),
    })
     .superRefine((data,ctx) => {
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: "custom",
                message: "password doesn't match",
                path:["confirmPassword"]
            })
        }

      if(data.username.split(" ").length !=2) {
          ctx.addIssue({
            code: "custom",
            message: "username must be two words",
            path:["username"]

     });
    }
  }),
};


     export const login = {
  body: z.strictObject({
      username: generalFields.username,
      email: z.email(),
      password: z
        .string()
        .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
          message:
            "Password must be at least 8 characters",
        }),
    })
    .refine((data) => data.username || data.email, {
      message: " username or email is required",
      path: ["username"], 
    }),
};

    export const confirmEmail = {
  body: z.strictObject({
    email: generalFields.email,
    otp: generalFields.otp,
  }),
};


    export const signupWithGmail = {
  body: z.strictObject({
    idToken: z.string(),
    otp: generalFields.otp,
  }),
};

export const sendForgetPasswordCode = {
  body : z.strictObject({
    email: generalFields.email ,  })

  }

  export const verifyForgetPassword ={
     body:sendForgetPasswordCode.body.extend({
       otp:generalFields.otp
     })
  }
  
    export const ResetForgetPassword  ={
     body:sendForgetPasswordCode.body.extend({
       otp:generalFields.otp,
       password:generalFields.password,
       confirmPassword:generalFields.confirmPassword
     })
     .refine((data) => 
      { return  data.password === data.confirmPassword; 

      } , {
        message: "password doesn't match",
        path: ["confirmPassword"]
      })
      
     
  }


export function sendForgetPassword(sendForgetPassword: any): import("express-serve-static-core").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>> {
    throw new Error("Function not implemented.");
}

