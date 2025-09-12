import { RoleEnum } from "../../DB/model/User.model";

export const endpoint ={
    profile:[RoleEnum.User],
    restoreAccount:[RoleEnum.Admin],
    hardDelete:[RoleEnum.Admin]
    
}