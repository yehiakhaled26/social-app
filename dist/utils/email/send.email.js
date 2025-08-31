"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = require("nodemailer");
const error_response_1 = require("../response/error.response");
const sendEmail = async (data) => {
    if (!data.html && !data.attachments?.length && !data.text) {
        throw new error_response_1.BadRequest("Email content is missing");
    }
    ;
    const transporter = (0, nodemailer_1.createTransport)({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
    const info = await transporter.sendMail({
        ...data,
        from: ` "Route ${process.env.APPLICATION_NAME} " <${process.env.EMAIL}>`,
    });
    console.log("Message sent:", info.messageId);
};
exports.sendEmail = sendEmail;
