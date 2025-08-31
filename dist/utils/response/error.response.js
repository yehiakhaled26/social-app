"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandling = exports.confilctException = exports.BadRequest = exports.AppError = void 0;
class AppError extends Error {
    message;
    statusCode;
    cause;
    constructor(message, statusCode, cause) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.cause = cause;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class BadRequest extends AppError {
    constructor(message, cause) {
        super(message, 400, cause);
    }
}
exports.BadRequest = BadRequest;
class confilctException extends AppError {
    constructor(message, cause) {
        super(message, 400, cause);
    }
}
exports.confilctException = confilctException;
const globalErrorHandling = (err, req, res, next) => {
    return res.status(err.statusCode || 500).json({ message: "Internal Server Error", error: err.message,
        stack: process.env.MOOD === "development" ? err.stack : undefined,
        cause: err.cause,
    });
};
exports.globalErrorHandling = globalErrorHandling;
