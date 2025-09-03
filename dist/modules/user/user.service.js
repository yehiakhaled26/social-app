"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_security_1 = require("../../utils/security/token.security");
const user_repository_1 = require("../../DB/repository/user.repository");
const User_model_1 = require("../../DB/model/User.model");
const token_repository_1 = require("../../DB/repository/token.repository");
const Token_model_1 = require("../../DB/model/Token.model");
class UserService {
    userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    tokenModel = new token_repository_1.TokenRepository(Token_model_1.TokenModel);
    constructor() { }
    Profile = async (req, res) => {
        return res.json({ message: "success", data: { user: req.user?._id,
                decoded: req.decoded?.iat,
            },
        });
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
        await this.userModel.updateOne({
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
        return res.status(201).json({
            message: "success",
            data: credentials
        });
    };
}
exports.default = new UserService();
