"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalFields = exports.validation = void 0;
const zod_1 = require("zod");
const validation = (schema) => {
    return (req, res, next) => {
        const errors = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const error = validationResult.error;
                errors.push({ key, issues: error.issues.map((issue) => {
                        return { path: issue.path[0],
                            message: issue.message };
                    }),
                });
            }
        }
        if (errors.length) {
            return res.status(400).json({ message: "validation error", errors });
        }
        return next();
    };
};
exports.validation = validation;
exports.generalFields = {
    username: zod_1.z
        .string({ error: "username is required" })
        .min(2, { message: "min username length is 2 characters" })
        .max(20, { message: "max username length is 20 characters" }),
    email: zod_1.z
        .string({ error: "email is required" })
        .email({ message: "valid email must be like example@domain.com" }),
    otp: zod_1.z
        .string().regex(/^\d{6}$/),
    password: zod_1.z
        .string({ error: "password is required" })
        .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/, {
        message: "password must be at least 8 characters, include 1 uppercase, 1 lowercase, and 1 number",
    }),
    confirmPassword: zod_1.z
        .string({ error: "confirmPassword is required" }),
};
