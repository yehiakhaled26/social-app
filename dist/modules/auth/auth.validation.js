"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetForgetPassword = exports.verifyForgetPassword = exports.sendForgetPasswordCode = exports.signupWithGmail = exports.confirmEmail = exports.login = exports.signup = void 0;
exports.sendForgetPassword = sendForgetPassword;
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middleware/validation.middleware");
exports.signup = {
    body: zod_1.z.strictObject({
        username: validation_middleware_1.generalFields.username,
        email: zod_1.z.email(),
        password: zod_1.z.string().regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/),
        confirmPassword: zod_1.z.string(),
    })
        .superRefine((data, ctx) => {
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: "custom",
                message: "password doesn't match",
                path: ["confirmPassword"]
            });
        }
        if (data.username.split(" ").length != 2) {
            ctx.addIssue({
                code: "custom",
                message: "username must be two words",
                path: ["username"]
            });
        }
    }),
};
exports.login = {
    body: zod_1.z.strictObject({
        username: validation_middleware_1.generalFields.username,
        email: zod_1.z.email(),
        password: zod_1.z
            .string()
            .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
            message: "Password must be at least 8 characters",
        }),
    })
        .refine((data) => data.username || data.email, {
        message: " username or email is required",
        path: ["username"],
    }),
};
exports.confirmEmail = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
        otp: validation_middleware_1.generalFields.otp,
    }),
};
exports.signupWithGmail = {
    body: zod_1.z.strictObject({
        idToken: zod_1.z.string(),
        otp: validation_middleware_1.generalFields.otp,
    }),
};
exports.sendForgetPasswordCode = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
    })
};
exports.verifyForgetPassword = {
    body: exports.sendForgetPasswordCode.body.extend({
        otp: validation_middleware_1.generalFields.otp
    })
};
exports.ResetForgetPassword = {
    body: exports.sendForgetPasswordCode.body.extend({
        otp: validation_middleware_1.generalFields.otp,
        password: validation_middleware_1.generalFields.password,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword
    })
        .refine((data) => {
        return data.password === data.confirmPassword;
    }, {
        message: "password doesn't match",
        path: ["confirmPassword"]
    })
};
function sendForgetPassword(sendForgetPassword) {
    throw new Error("Function not implemented.");
}
