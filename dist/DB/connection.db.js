"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const User_model_1 = require("./model/User.model");
const connectBD = async () => {
    try {
        const result = await (0, mongoose_1.connect)(process.env.DB_URL, {
            serverSelectionTimeoutMS: 50000,
        });
        await User_model_1.UserModel.syncIndexes();
        console.log(result.models);
        console.log("DataBase Connected Successfully");
    }
    catch (error) {
        console.log("Database Connection Failed");
        console.log(error);
    }
};
exports.default = connectBD;
