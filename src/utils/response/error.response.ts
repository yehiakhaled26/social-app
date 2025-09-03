import { NextFunction, Request, Response } from "express";



 interface IError extends Error {
    statusCode: number;
    } 

export class AppError extends Error {
 
    constructor(public override message: string,
         public statusCode: number ,
         public override cause?: unknown
        ) 
        {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequest extends AppError {
    constructor(message: string, cause?: unknown) {
        super(message, 400, cause);
    }
}

export class unauthorized extends AppError {
    constructor(message: string, cause?: unknown) {
        super(message, 401, cause);
    }
}
export class ForbiddenException extends AppError {
    constructor(message: string, cause?: unknown) {
        super(message, 403, cause);
    }
}

export class confilctException extends AppError {
    constructor(message: string, cause?: unknown) {
        super(message, 400, cause);
    }
}

export const globalErrorHandling = (err: IError , req: Request, res: Response, next: NextFunction) => { 

    return   res.status(err.statusCode || 500).json(
          { message: "Internal Server Error", error: err.message,
           stack: process.env.MOOD === "development" ? err.stack : undefined,
           cause :err.cause,

  });

}