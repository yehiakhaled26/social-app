import { validation } from "../../middleware/validation.middleware";
import authservice  from "./auth.service"; 
import { Router } from "express";
import * as validators from './auth.validation'
const router = Router();


router.post("/signup", validation(validators.signup ), authservice.signup);
router.patch("/confirm-email", validation(validators.confirmEmail), authservice.confirmEmail);
router.post("/login", validation(validators.login), authservice.login);

export default router;