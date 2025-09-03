import {Router} from "express";
import userService from "./user.service";

import { authentication  } from "../../middleware/authentication.middleware";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./user.validation";



const router = Router();

router.get("/", authentication(), userService.Profile);
router.post("/refresh-token",authentication(), userService.refreshToken);

router.post("/logout",authentication() ,validation(validators.logout),userService.logout);


export default router;