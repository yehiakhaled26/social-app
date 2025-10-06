"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.enableTwoStepVerificationEnum = exports.providerEnum = exports.genderEnum = exports.RoleEnum = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = require("mongoose");
const hash_security_1 = require("../../utils/security/hash.security");
const email_event_1 = require("../../utils/event/email.event");
const error_response_1 = require("../../utils/response/error.response");
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["User"] = "User";
    RoleEnum["Admin"] = "Admin";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var genderEnum;
(function (genderEnum) {
    genderEnum["male"] = "male";
    genderEnum["female"] = "female";
})(genderEnum || (exports.genderEnum = genderEnum = {}));
var providerEnum;
(function (providerEnum) {
    providerEnum["GOOGLE"] = "GOOGLE";
    providerEnum["SYSTEM"] = "SYSTEM";
})(providerEnum || (exports.providerEnum = providerEnum = {}));
var enableTwoStepVerificationEnum;
(function (enableTwoStepVerificationEnum) {
    enableTwoStepVerificationEnum["email"] = "email";
    enableTwoStepVerificationEnum["sms"] = "sms";
})(enableTwoStepVerificationEnum || (exports.enableTwoStepVerificationEnum = enableTwoStepVerificationEnum = {}));
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, min: 2, max: 25 },
    lastName: { type: String, required: true, min: 2, max: 25 },
    slug: { type: String, required: true, min: 5, max: 51 },
    email: { type: String, required: true, unique: true },
    ConfirmEmailOtp: { type: String },
    ConfirmedAt: { type: Date },
    freezedAt: Date,
    freezedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    password: { type: String, required: function () {
            return this.provider === providerEnum.GOOGLE ? false : true;
        } },
    resetPasswordOtp: { type: String, required: false },
    changeCerdentialsTime: Date,
    phone: { type: String },
    address: { type: String },
    profileImage: String,
    temProfileImage: String,
    coverImage: [String],
    gender: { type: String, enum: genderEnum, default: genderEnum.male },
    role: { type: String, enum: RoleEnum, default: RoleEnum.User },
    provider: { type: String, enum: providerEnum, default: providerEnum.SYSTEM },
}, {
    strictQuery: true,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema.virtual("username").set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, "-") });
}).get(function () {
    return this.firstName + " " + this.lastName;
});
userSchema.pre("save", async function (next) {
    this.wasNew = this.isNew;
    if (this.isModified("password")) {
        this.password = await (0, hash_security_1.generateHash)(this.password);
    }
    if (this.isModified("confirmEmailOtp")) {
        this.ConfirmEmailPlainOtp = this.ConfirmEmailOtp;
        this.ConfirmEmailOtp = await (0, hash_security_1.generateHash)(this.ConfirmEmailOtp);
    }
    next();
});
userSchema.post("save", async function (doc, next) {
    const that = this;
    if (that.wasNew && that.ConfirmEmailPlainOtp) {
        email_event_1.emailEvent.emit("confirmEmail", { to: this.email,
            otp: that.ConfirmEmailPlainOtp,
        });
    }
    next();
});
userSchema.pre("validate", function (next) {
    console.log({ pre_validate: this });
    if (!this.slug?.includes("-")) {
        return next(new error_response_1.BadRequest("slug is required"));
    }
    next();
});
userSchema.pre(["find", "findOne"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
exports.UserModel = mongoose_2.models.User || (0, mongoose_2.model)("User", userSchema);
