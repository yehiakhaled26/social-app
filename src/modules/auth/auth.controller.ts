import { validation } from "../../middleware/validation.middleware";
import authservice  from "./auth.service"; 
import { Router } from "express";
import * as validators from './auth.validation'
const router = Router();


router.post("/signup", validation(validators.signup ), authservice.signup);
router.post("/login", validation(validators.login), authservice.login);

router.post("/signup-gmail", validation(validators.signupWithGmail), authservice.signupWithGmail);
router.post("/login-gmail", validation(validators.signupWithGmail), authservice.loginWithGmail);
router.patch("/confirm-email", validation(validators.confirmEmail), authservice.confirmEmail);

router.patch("/send-forget-password", validation(validators.sendForgetPasswordCode), authservice.sendForgetCode);
router.patch("/verify-forget-password", validation(validators.verifyForgetPassword), authservice.verifyForgetCode);
router.patch("/reset-forget-password", validation(validators.ResetForgetPassword), authservice.resetForgetCode);
export default router;