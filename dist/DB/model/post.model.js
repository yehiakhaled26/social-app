"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = exports.LikeActionEnum = exports.AvailabilityEnum = exports.AllowCommentsEnum = void 0;
const mongoose_1 = require("mongoose");
var AllowCommentsEnum;
(function (AllowCommentsEnum) {
    AllowCommentsEnum["allow"] = "allow";
    AllowCommentsEnum["deny"] = "deny";
})(AllowCommentsEnum || (exports.AllowCommentsEnum = AllowCommentsEnum = {}));
var AvailabilityEnum;
(function (AvailabilityEnum) {
    AvailabilityEnum["public"] = "public";
    AvailabilityEnum["friends"] = "friends";
    AvailabilityEnum["onlyMe"] = "only-me";
})(AvailabilityEnum || (exports.AvailabilityEnum = AvailabilityEnum = {}));
var LikeActionEnum;
(function (LikeActionEnum) {
    LikeActionEnum["like"] = "like";
    LikeActionEnum["unlike"] = "unlike";
})(LikeActionEnum || (exports.LikeActionEnum = LikeActionEnum = {}));
const postSchema = new mongoose_1.Schema({
    content: { types: String, minLength: 2, maxlength: 500000, required: function () {
            return !this.attachments?.length;
        } },
    attachments: [String],
    assetsFolderId: { type: String, required: true },
    allowComments: { type: String, enum: AllowCommentsEnum, default: AllowCommentsEnum.allow },
    availability: { type: String, enum: AvailabilityEnum, default: AvailabilityEnum.public },
    tags: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "user" }],
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "user" }],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "user", required: true },
    freezedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "user" },
    freezedAt: Date,
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "user" },
    restoredAt: Date,
}, {
    timestamps: true,
    strictQuery: true,
});
postSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
exports.PostModel = mongoose_1.models.post || (0, mongoose_1.model)("post", postSchema);
