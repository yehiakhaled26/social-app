"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const User_model_1 = require("../../DB/model/User.model");
const error_response_1 = require("../../utils/response/error.response");
const user_repository_1 = require("../../DB/repository/user.repository");
const hash_security_1 = require("../../utils/security/hash.security");
const otp_1 = require("../../utils/security/otp");
const email_event_1 = require("../../utils/event/email.event");
const token_security_1 = require("../../utils/security/token.security");
const google_auth_library_1 = require("google-auth-library");
class AuthenticationService {
    userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    async verifyGmailAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_ID?.split(",") || []
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new error_response_1.BadRequest("Gmail account not verified");
        }
        return payload;
    }
    loginWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: { email,
                provider: User_model_1.providerEnum.GOOGLE },
        });
        if (!user) {
            throw new error_response_1.BadRequest("No Register Account ");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(user);
        return res.json({ message: "success", data: { credentials } });
    };
    signupWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email, family_name, given_name, picture } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: { email },
        });
        if (user) {
            if (user.provider === User_model_1.providerEnum.GOOGLE) {
                return await this.loginWithGmail(req, res);
            }
            throw new error_response_1.confilctException(`Email already exist ::: ${user.provider}`);
        }
        const [newUser] = (await this.userModel.create({
            data: [{
                    firstName: given_name,
                    lastName: family_name,
                    email: email,
                    profileImage: picture,
                    ConfirmedAt: new Date(),
                    provider: User_model_1.providerEnum.GOOGLE,
                }],
        })) || [];
        if (!newUser) {
            throw new error_response_1.BadRequest("User not created");
        }
        const credentials = await (0, token_security_1.createLoginCredentials)(newUser);
        return res.status(201).json({ message: "success", data: { credentials } });
    };
    signup = async (req, res) => {
        let { username, email, password } = req.body;
        console.log({ username, email, password });
        const checkUserExist = await this.userModel.findOne({
            filter: { email },
            select: "email",
            options: { lean: false,
            },
        });
        console.log(checkUserExist);
        if (checkUserExist?._id) {
            throw new error_response_1.confilctException("Email already exist");
        }
        const otp = (0, otp_1.generateNumberOtp)();
        const user = await this.userModel.createUser({
            data: [{ username, email, password: await (0, hash_security_1.generateHash)(password), ConfirmEmailOtp: await (0, hash_security_1.generateHash)(String(otp)) }],
            options: {},
        });
        email_event_1.emailEvent.emit("confirmEmail", { to: email, otp });
        return res.status(201).json({ message: "success", data: { user }
        });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: { email,
                ConfirmEmailOtp: { $exists: true },
                ConfirmedAt: { $exists: false } },
        });
        if (!user) {
            throw new error_response_1.BadRequest("invalid account");
        }
        if (!await (0, hash_security_1.compareHash)(otp, user.ConfirmEmailOtp)) {
            throw new error_response_1.BadRequest("invalid otp");
        }
        await this.userModel.updateOne({
            filter: { email },
            update: { ConfirmedAt: new Date(),
                $unset: { ConfirmEmailOtp: 1 }
            },
        });
        return res.status(200).json({ message: "success" });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this.userModel.findOne({
            filter: { email, provider: User_model_1.providerEnum.SYSTEM },
        });
        if (!user) {
            throw new error_response_1.BadRequest("invalid account");
        }
        ;
        if (!user.ConfirmedAt) {
            throw new error_response_1.BadRequest("please confirm your email");
        }
        if (!(0, hash_security_1.compareHash)(password, user.password)) {
            throw new error_response_1.BadRequest("invalid account");
        }
        const Credentials = await (0, token_security_1.createLoginCredentials)(user);
        return res.status(200).json({ message: "success", data: { Credentials }
        });
    };
    sendForgetCode = async (req, res) => {
        const { email } = req.body;
        const user = await this.userModel.findOne({
            filter: { email, provider: User_model_1.providerEnum.SYSTEM, ConfirmedAt: { $exists: true } },
        });
        if (!user) {
            throw new error_response_1.BadRequest("invalid account due to one of following reason");
        }
        ;
        const otp = (0, otp_1.generateNumberOtp)();
        const result = await this.userModel.updateOne({
            filter: { email },
            update: { resetPasswordOtp: await (0, hash_security_1.generateHash)(String(otp)) },
        });
        if (!result.modifiedCount) {
            throw new error_response_1.BadRequest("fail to send code");
        }
        email_event_1.emailEvent.emit("resetPassword", { to: email, otp });
        return res.status(200).json({ message: "success" });
    };
    verifyForgetCode = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: { email, provider: User_model_1.providerEnum.SYSTEM,
                resetPasswordOtp: { $exists: true } },
        });
        if (!user) {
            throw new error_response_1.BadRequest("invalid account due to one of following reason");
        }
        ;
        if (!await (0, hash_security_1.compareHash)(otp, user.resetPasswordOtp)) {
            {
                throw new error_response_1.confilctException("invalid otp");
            }
        }
        return res.json({ message: "success" });
    };
    resetForgetCode = async (req, res) => {
        const { email, otp, password } = req.body;
        const user = await this.userModel.findOne({
            filter: { email, provider: User_model_1.providerEnum.SYSTEM,
                resetPasswordOtp: { $exists: true } },
        });
        if (!user) {
            throw new error_response_1.BadRequest("invalid account due to one of following reason");
        }
        ;
        if (!await (0, hash_security_1.compareHash)(otp, user.resetPasswordOtp)) {
            throw new error_response_1.confilctException("invalid otp");
        }
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                password: await (0, hash_security_1.generateHash)(password),
                changeCerdentialsTime: new Date(),
                $unset: { resetPasswordOtp: 1 },
            },
        });
        if (!result.matchedCount) {
            throw new error_response_1.BadRequest("fail to resent password");
        }
        return res.json({ message: "success" });
    };
}
exports.AuthenticationService = AuthenticationService;
;
exports.default = new AuthenticationService();
