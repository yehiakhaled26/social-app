"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const User_model_1 = require("../../DB/model/User.model");
const error_response_1 = require("../../utils/response/error.response");
const user_repository_1 = require("../../DB/repository/user.repository");
const hash_security_1 = require("../../utils/security/hash.security");
const otp_1 = require("../../utils/otp");
const email_event_1 = require("../../utils/event/email.event");
class AuthenticationService {
    userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
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
    login = (req, res) => {
        return res.status(200).json({ message: "success", data: req.body });
    };
}
exports.AuthenticationService = AuthenticationService;
exports.default = new AuthenticationService();
