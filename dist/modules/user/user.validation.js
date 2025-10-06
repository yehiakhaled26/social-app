"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hardDelete = exports.updateEmailSchema = exports.updateBasicInfoSchema = exports.updatePasswordSchema = exports.restoreAccount = exports.freezeAccount = exports.logout = exports.verifyTwoStepSchema = exports.enableTwoStepSchema = void 0;
const mongoose_1 = require("mongoose");
const token_security_js_1 = require("../../utils/security/token.security.js");
const zod_1 = require("zod");
exports.enableTwoStepSchema = zod_1.z.object({
    method: zod_1.z.enum(["email", "sms"]),
});
exports.verifyTwoStepSchema = zod_1.z.object({
    code: zod_1.z.string().min(4).max(8),
});
exports.logout = {
    body: zod_1.z.object({
        flag: zod_1.z.enum(token_security_js_1.logoutEnum).optional().default(token_security_js_1.logoutEnum.only),
    }),
};
exports.freezeAccount = {
    params: zod_1.z.object({
        userId: zod_1.z.string().optional(),
    }).optional().refine((data) => {
        return data?.userId ? mongoose_1.Types.ObjectId.isValid(data.userId) : true;
    }, {
        error: "invalid-object-format",
        path: ["userId"],
    }),
};
exports.restoreAccount = {
    params: zod_1.z.object({
        userId: zod_1.z.string(),
    })
        .refine((data) => {
        return mongoose_1.Types.ObjectId.isValid(data.userId);
    }, {
        error: "invalid-object-format",
        path: ["userId"],
    }),
};
exports.updatePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(6),
    newPassword: zod_1.z.string().min(6),
});
exports.updateBasicInfoSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2),
    lastName: zod_1.z.string().min(2),
    profileImage: zod_1.z.string().optional(),
});
exports.updateEmailSchema = zod_1.z.object({
    newEmail: zod_1.z.email(),
});
exports.hardDelete = exports.restoreAccount;
