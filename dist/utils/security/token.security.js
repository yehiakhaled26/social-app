"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRevokeToken = exports.decodeToken = exports.createLoginCredentials = exports.detectSignatureLevel = exports.getSignatures = exports.verifyToken = exports.generateToken = exports.logoutEnum = exports.TokenEnum = exports.SignatureLevelEnum = void 0;
const uuid_1 = require("uuid");
const jsonwebtoken_1 = require("jsonwebtoken");
const User_model_1 = require("../../DB/model/User.model");
const jsonwebtoken_2 = require("jsonwebtoken");
const error_response_1 = require("../response/error.response");
const user_repository_1 = require("../../DB/repository/user.repository");
const token_repository_1 = require("../../DB/repository/token.repository");
const Token_model_1 = require("../../DB/model/Token.model");
var SignatureLevelEnum;
(function (SignatureLevelEnum) {
    SignatureLevelEnum["bearer"] = "bearer";
    SignatureLevelEnum["system"] = "system";
})(SignatureLevelEnum || (exports.SignatureLevelEnum = SignatureLevelEnum = {}));
var TokenEnum;
(function (TokenEnum) {
    TokenEnum["access"] = "access";
    TokenEnum["refresh"] = "refresh";
})(TokenEnum || (exports.TokenEnum = TokenEnum = {}));
var logoutEnum;
(function (logoutEnum) {
    logoutEnum["only"] = "only";
    logoutEnum["all"] = "all";
})(logoutEnum || (exports.logoutEnum = logoutEnum = {}));
const generateToken = async ({ payload, secret = process.env.USER_TOKEN_SIGNATURE, options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) }, }) => {
    return (0, jsonwebtoken_1.sign)(payload, secret, options);
};
exports.generateToken = generateToken;
const verifyToken = async ({ token, secret = process.env.USER_TOKEN_SIGNATURE, }) => {
    return (0, jsonwebtoken_2.verify)(token, secret);
};
exports.verifyToken = verifyToken;
const getSignatures = async (signatureLevel = SignatureLevelEnum.bearer) => {
    let Signatures = { access_signature: "", refresh_signature: "" };
    switch (signatureLevel) {
        case SignatureLevelEnum.system:
            Signatures.access_signature = process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE;
            Signatures.refresh_signature = process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE;
            break;
        default:
            Signatures.access_signature = process.env.ACCESS_USER_TOKEN_SIGNATURE;
            Signatures.refresh_signature = process.env.REFRESH_USER_TOKEN_SIGNATURE;
            break;
    }
    return Signatures;
};
exports.getSignatures = getSignatures;
const detectSignatureLevel = async (role = User_model_1.RoleEnum.User) => {
    let SignatureLevel = SignatureLevelEnum.bearer;
    switch (role) {
        case User_model_1.RoleEnum.Admin:
            SignatureLevel = SignatureLevelEnum.system;
            break;
        default:
            SignatureLevel = SignatureLevelEnum.bearer;
            break;
    }
    return SignatureLevel;
};
exports.detectSignatureLevel = detectSignatureLevel;
const createLoginCredentials = async (user) => {
    const signatureLevel = await (0, exports.detectSignatureLevel)(user.role);
    const Signatures = await (0, exports.getSignatures)(signatureLevel);
    console.log(Signatures);
    const jwtid = (0, uuid_1.v4)();
    const access_token = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: Signatures.access_signature,
        options: { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN), jwtid
        }
    });
    const refresh_token = await (0, exports.generateToken)({
        payload: { _id: user._id },
        secret: Signatures.refresh_signature,
        options: { expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN), jwtid
        }
    });
    return { access_token, refresh_token };
};
exports.createLoginCredentials = createLoginCredentials;
const decodeToken = async ({ authorization, tokenType = TokenEnum.access }) => {
    const userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    const tokenModel = new token_repository_1.TokenRepository(Token_model_1.TokenModel);
    const [bearerKey, token] = authorization.split(" ");
    if (!bearerKey || !token) {
        throw new error_response_1.unauthorized("missing token parts");
    }
    const Signatures = await (0, exports.getSignatures)(bearerKey);
    const decoded = await (0, exports.verifyToken)({
        token, secret: tokenType === TokenEnum.refresh ? Signatures.refresh_signature : Signatures.access_signature
    });
    if (!decoded?._id || !decoded?.iat) {
        throw new error_response_1.BadRequest("invalid token");
    }
    if (await tokenModel.findOne({ filter: { jti: decoded.jti } })) {
        throw new error_response_1.unauthorized("invalid login credentials");
    }
    const user = await userModel.findOne({ filter: { _id: decoded._id } });
    if (!user) {
        throw new error_response_1.BadRequest("user not found");
    }
    if ((user.changeCerdentialsTime?.getTime() || 0) > decoded.iat * 1000) {
        throw new error_response_1.unauthorized("invalid login credentials");
    }
    return { user, decoded };
};
exports.decodeToken = decodeToken;
const createRevokeToken = async (decoded) => {
    const tokenModel = new token_repository_1.TokenRepository(Token_model_1.TokenModel);
    const [result] = (await tokenModel.create({
        data: [{
                jti: decoded?.jti,
                expiresIn: decoded?.iat +
                    Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
                userId: decoded?._id,
            },
        ],
    })) || [];
    if (!result) {
        throw new error_response_1.BadRequest("error in create revoke token");
    }
    return result;
};
exports.createRevokeToken = createRevokeToken;
