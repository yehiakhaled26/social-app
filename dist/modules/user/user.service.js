"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_security_1 = require("../../utils/security/token.security");
const User_model_1 = require("../../DB/model/User.model");
const user_repository_1 = require("../../DB/repository/user.repository");
const User_model_2 = require("../../DB/model/User.model");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
const s3_config_1 = require("../../utils/multer/s3.config");
const error_response_1 = require("../../utils/response/error.response");
const s3_event_1 = require("../../utils/multer/s3.event");
const success_response_1 = require("../../utils/response/success.response");
const send_email_1 = require("../../utils/email/send.email");
const hash_security_1 = require("../../utils/security/hash.security");
class UserService {
    userModel = new user_repository_1.UserRepository(User_model_2.UserModel);
    constructor() { }
    Profile = async (req, res) => {
        if (!req.user) {
            throw new error_response_1.unauthorized("missing user details");
        }
        return (0, success_response_1.successResponse)({ res, data: { user: req.user } });
    };
    freezeAccount = async (req, res) => {
        const { userId } = req.params || {};
        if (userId && req.user?.role !== User_model_1.RoleEnum.Admin) {
            throw new error_response_1.ForbiddenException("not authorized user");
        }
        const user = await this.userModel.UpdateOne({
            filter: {
                _id: userId || req.user?._id,
                freezedAt: { $exists: false },
            },
            update: {
                freezedAt: new Date(),
                freezedBy: req.user?._id,
                changeCredentialsTime: new Date(),
                $unset: {
                    restoredAt: 1,
                    restoredBy: 1
                }
            }
        });
        if (!user.matchedCount) {
            throw new error_response_1.BadRequest("fail to update user");
        }
        return (0, success_response_1.successResponse)({ res });
    };
    restoreAccount = async (req, res) => {
        const { userId } = req.params;
        if (userId && req.user?.role !== User_model_1.RoleEnum.Admin) {
            throw new error_response_1.ForbiddenException("not authorized user");
        }
        const user = await this.userModel.UpdateOne({
            filter: {
                _id: userId,
                freezedBy: { $ne: userId },
            },
            update: {
                restoredAt: new Date(),
                restoredBy: req.user?._id,
                changeCredentialsTime: new Date(),
                $unset: {
                    freezedAt: 1,
                    freezedBy: 1
                }
            }
        });
        if (!user.matchedCount) {
            throw new error_response_1.BadRequest("fail to restore user");
        }
        return res.json({ message: "Done", data: user });
    };
    hardDeleteAccount = async (req, res) => {
        const { userId } = req.params;
        if (userId && req.user?.role !== User_model_1.RoleEnum.Admin) {
            throw new error_response_1.ForbiddenException("not authorized user");
        }
        const user = await this.userModel.DeleteOne({
            filter: {
                _id: userId,
                freezedAt: { $exists: true },
            },
            update: {
                restoredAt: new Date(),
                restoredBy: req.user?._id,
                changeCredentialsTime: new Date(),
                $unset: {
                    freezedAt: 1,
                    freezedBy: 1
                }
            }
        });
        if (!user.deletedCount) {
            throw new error_response_1.BadRequest("user not found or hard delete e user");
        }
        await (0, s3_config_1.deleteFolderByPrefix)({ path: `users/${userId}` });
        return res.json({ message: "Done", data: user });
    };
    profileImage = async (req, res) => {
        const { ContentType, originalname } = req.body;
        const { url, Key } = await (0, s3_config_1.createPreSignedUpLoadLink)({ ContentType, originalname, path: `users/${req.decoded?._id}`, });
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: {
                profileImage: Key,
                temProfileImage: req.user?.profileImage
            }
        });
        if (!user) {
            throw new error_response_1.BadRequest("fail to update user image");
        }
        s3_event_1.s3Event.emit("trackProfileImageUpload", {
            userId: req.user?._id,
            oldKey: req.user?.profileImage,
            Key,
            expiresIn: 30000
        });
        return (0, success_response_1.successResponse)({ res, data: { url }
        });
    };
    profileCoverImage = async (req, res) => {
        const urls = await (0, s3_config_1.uploadFiles)({
            storageApproach: cloud_multer_1.StorageEnum.disk,
            files: req.files,
            path: `users/${req.decoded?._id}/cover`,
            userLarge: true
        });
        const user = await this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: {
                coverImage: urls,
            }
        });
        if (!user) {
            throw new error_response_1.BadRequest("fail to update user image");
        }
        if (req.user?.coverImage) {
            await (0, s3_config_1.deleteFiles)({ urls: req.user?.coverImage });
        }
        return (0, success_response_1.successResponse)({ res, data: { user } });
    };
    logout = async (req, res) => {
        const { flag } = req.body;
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case token_security_1.logoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            default:
                await (0, token_security_1.createRevokeToken)(req.decoded);
                statusCode = 201;
                break;
        }
        await this.userModel.UpdateOne({
            filter: { _id: req.decoded?._id },
            update,
        });
        return res.status(statusCode).json({
            message: "success",
            data: {
                user: req.user?._id,
                decoded: req.decoded?.iat,
            }
        });
    };
    refreshToken = async (req, res) => {
        const credentials = await (0, token_security_1.createLoginCredentials)(req.user);
        await (0, token_security_1.createRevokeToken)(req.decoded);
        return (0, success_response_1.successResponse)({ res, statusCode: 201, data: { credentials } });
    };
    updatePassword = async (req, res) => {
        const { oldPassword, newPassword } = req.body;
        const user = await this.userModel.findOne({ filter: { _id: req.user?._id } });
        if (!user) {
            throw new error_response_1.BadRequest("User not found");
        }
        const isMatch = await (0, hash_security_1.compareHash)(oldPassword, user.password);
        if (!isMatch) {
            throw new error_response_1.BadRequest("Old password is incorrect");
        }
        const hashedNewPassword = await (0, hash_security_1.generateHash)(newPassword);
        await this.userModel.updateOne({
            filter: { _id: req.user?._id },
            update: { password: hashedNewPassword },
        });
        return (0, success_response_1.successResponse)({ res, message: "Password updated successfully" });
    };
    updateBasicInfo = async (req, res) => {
        const { firstName, lastName, profileImage } = req.body;
        await this.userModel.updateOne({
            filter: { _id: req.user?._id },
            update: { firstName, lastName, profileImage },
        });
        return (0, success_response_1.successResponse)({ res, message: "Profile updated successfully" });
    };
    updateEmail = async (req, res) => {
        const { newEmail } = req.body;
        await this.userModel.updateOne({
            filter: { _id: req.user?._id },
            update: { email: newEmail },
        });
        return (0, success_response_1.successResponse)({ res, message: "Email updated successfully" });
    };
    sendEmailToTaggedUsers = async (req, res) => {
        const { tags, message } = req.body;
        const users = await this.userModel.find({ filter: { _id: { $in: tags } } });
        users.forEach(user => (0, send_email_1.sendEmail)({ to: user.email, text: message }));
        return (0, success_response_1.successResponse)({ res, message: "Emails sent to tagged users" });
    };
}
;
exports.default = new UserService();
