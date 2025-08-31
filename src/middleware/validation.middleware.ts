
import type { Request , Response , NextFunction } from "express";
import {z} from "zod";
import {  ZodError, ZodType  } from "zod";




type KeyReqType = keyof Request 
type SchemaType = Partial<Record<KeyReqType , ZodType >>;

export const validation = ( schema: SchemaType ) => {
    return (req: Request, res: Response, next: NextFunction) => {

        const errors:Array <{
            key : KeyReqType;

            issues : Array<{
                path : string | number | symbol | undefined ;
                message: string;
            }>;
        }>=[] ;


    //     const errors: {
    //   key: KeyReqType;
    //   issues: { path: string | number | symbol | undefined; message: string }[];
    // }[] = [];

        for (const key of Object.keys(schema) as KeyReqType[]) {

         if (!schema[key]) continue;

            const validationResult = schema[key].safeParse(req[key]);

            if (!validationResult.success) {

                 const error = validationResult.error as ZodError
                errors.push({ key , issues: error.issues.map((issue) => {
                     return {path: issue.path[0] 
                     , message: issue.message};
                }),
            });
            }
        }

        if (errors.length) {
            return res.status(400).json({ message: "validation error", errors });
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
};
