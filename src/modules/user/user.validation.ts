


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

export const hardDelete = restoreAccount;