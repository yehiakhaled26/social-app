"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = void 0;
const token_security_js_1 = require("../../utils/security/token.security.js");
const zod_1 = require("zod");
exports.logout = {
    body: zod_1.z.object({
        flag: zod_1.z.enum(token_security_js_1.logoutEnum).optional().default(token_security_js_1.logoutEnum.only),
    }),
};
