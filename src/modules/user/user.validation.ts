


import {logoutEnum} from "../../utils/security/token.security.js";
import {z} from "zod";


export const logout = {
    body: z.object({
        flag: z.enum(logoutEnum).optional().default(logoutEnum.only),
    }),
};