import {Router} from "express";
import userService from "./user.service";

import { authentication, authorization  } from "../../middleware/authentication.middleware";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./user.validation";
import { cloudFileUpload,fileValidation, StorageEnum } from "../../utils/multer/cloud.multer";
import { endpoint } from "./user.authorization";





const router = Router();

router.delete("{/:userId}/freeze-account" , authentication() , validation(validators.freezeAccount) , userService.freezeAccount);

router.delete("/:userId" , authorization(endpoint.hardDelete) , validation(validators.freezeAccount) , userService.hardDeleteAccount);


router.patch("/:userId/restore-account" , authorization(endpoint.restoreAccount) , validation(validators.restoreAccount) , userService.restoreAccount);


router.get("/", authentication(), userService.Profile);

router.patch("/profile-image", authentication(), userService.profileImage);

router.patch("/profile-Cover-image", authentication(), cloudFileUpload({
    validation: fileValidation.image , 
    storageApproach:StorageEnum.disk
}).array("images" , 2), userService.profileCoverImage);

router.post("/refresh-token",authentication(), userService.refreshToken);

router.post("/logout",authentication() ,validation(validators.logout),userService.logout);

router.patch(
  "/update-password",
  authentication(),
  validation( validators.updatePasswordSchema ), 
  userService.updatePassword
);

router.patch(
  "/update-basic-info",
  authentication(),
  validation(validators.updateBasicInfoSchema),
  userService.updateBasicInfo
);

router.patch(
  "/update-email",
  authentication(),
  validation(validators.updateEmailSchema),
  userService.updateEmail
);


router.post(
  "/send-email-tags",
  authentication(),
  userService.sendEmailToTaggedUsers
);

router.post(
  "/enable-2step",
  authentication(),
  validation(validators.enableTwoStepSchema),
  userService.enableTwoStepVerification
);

router.post(
  "/verify-2step",
  authentication(),
  validation(validators.verifyTwoStepSchema),
  userService.enableTwoStepVerification
);


export default router;