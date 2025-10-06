


import { Types } from "mongoose";
import {logoutEnum} from "../../utils/security/token.security.js";
import {z} from "zod";


export const logout = {
    body: z.object({
        flag: z.enum(logoutEnum).optional().default(logoutEnum.only),
    }),
};

export const freezeAccount = {
    params: z.object({
        userId: z.string().optional(),
    }).optional().refine((data) => {
         return data?.userId ? Types.ObjectId.isValid(data.userId): true; 
        },
    {
        error: "invalid-object-format",
        path: ["userId"],
    }),
};

export const restoreAccount = {
    params: z.object({
        userId: z.string(),
    })
    .refine((data) => {
         return Types.ObjectId.isValid(data.userId); 
        },
    {
        error: "invalid-object-format",
        path: ["userId"],
    }),
};

export const updatePasswordSchema = {
  body: z.strictObject({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
})};

export const updateBasicInfoSchema ={
  body: z.strictObject({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  profileImage: z.string().url().optional(),
})};

export const updateEmailSchema = {
body:z.strictObject({
  newEmail: z.email(),
})};

export const enableTwoStepSchema ={
body: z.strictObject({
  method: z.enum(["email"]),
})};

export const verifyTwoStepSchema = {
  body:z.strictObject ({
    otp: z.string().length(6),
  
})
};


export const hardDelete = restoreAccount;