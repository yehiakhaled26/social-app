"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmEmail = exports.login = exports.signup = void 0;
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
