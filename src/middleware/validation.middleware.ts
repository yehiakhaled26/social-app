
import type { Request , Response , NextFunction } from "express";
import {z} from "zod";
import {  ZodError, ZodType  } from "zod";
import { BadRequest } from "../utils/response/error.response";
import { Types } from "mongoose";




type KeyReqType = keyof Request 
type SchemaType = Partial<Record<KeyReqType , ZodType >>;
type ValidationErrorType = Array<{
     key: KeyReqType;
      issues: Array< { 
        path: (string | number | symbol | undefined)[];
         message: string ;
    }>;
  }>;

export const validation = (schema: SchemaType) => {
    return (req: Request, res: Response, next: NextFunction):NextFunction => {
const validationErrors: ValidationErrorType =[];

        for (const key of Object.keys(schema) as KeyReqType[]) {

         if (!schema[key]) continue;
         if (req.file) {
          req.body.attachment = req.file;
          
         }
             if (req.files) {
          req.body.attachments = req.files;
          
         }

            const validationResult = schema[key].safeParse(req[key]);

            if (!validationResult.success) {

                 const errors = validationResult.error as ZodError
                validationErrors.push({
                   key ,
                    issues: errors.issues.map((issue) => {
                     return {path: issue.path
                     , message: issue.message};
                }),
            });
            }
        }

        if (validationErrors.length) {
            throw new BadRequest( "validation error", {validationErrors});
        }

        return next() as unknown as NextFunction;
    }
}


export const generalFields = {
  username: z
    .string({ error: "username is required" })
    .min(2, { message: "min username length is 2 characters" })
    .max(20, { message: "max username length is 20 characters" }),

  email: z
    .string({ error: "email is required" })
    .email({ message: "valid email must be like example@domain.com" }),
    
  otp: z
    .string().regex(/^\d{6}$/),

  password: z
    .string({ error: "password is required" })
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/, {
      message:
        "password must be at least 8 characters, include 1 uppercase, 1 lowercase, and 1 number",
    }),

  confirmPassword: z
    .string({ error: "confirmPassword is required" }),

    file: function(mimetype:string[]) {
      return z.strictObject({

      fieldname: z.string(),
       originalname: z.string(),
        encoding: z.string(),
         mimetype: z.enum(mimetype),
          buffer: z.any().optional(),
          path:z.any().optional(),
          size:z.number()

      }).refine(data=>{
        return data.buffer || data.path; 
      },{
        error:"no path or buffer available" , path:["file"]
      })
    },
    
    id: z.string().refine(data=>{
      return Types.ObjectId.isValid(data)} ,
      {error:"invalid objectid format"})
  
};
