"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.genderEnum = exports.RoleEnum = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = require("mongoose");
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
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, min: 2, max: 25 },
    lastName: { type: String, required: true, min: 2, max: 25 },
    email: { type: String, required: true, unique: true },
    ConfirmEmailOtp: { type: String },
    ConfirmedAt: { type: Date },
    password: { type: String, required: true },
    resetPasswordOtp: { type: String, required: false },
    changeCerdentialsTime: Date,
    phone: { type: String },
    address: { type: String },
    gender: { type: String, enum: genderEnum, default: genderEnum.male },
    role: { type: String, enum: RoleEnum, default: RoleEnum.User },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema.virtual("username").set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName });
}).get(function () {
    return this.firstName + " " + this.lastName;
});
exports.UserModel = mongoose_2.models.User || (0, mongoose_2.model)("User", userSchema);
