
   import { resolve } from 'node:path';    
   import { config } from 'dotenv';
   config ({ path: resolve("./config/.env.development") });

   import type { Express ,  Request,  Response } from "express";
   import express from "express";
   import cors from "cors";

   import helmet from "helmet";
   import {rateLimit} from "express-rate-limit";

   import authController from "./modules/auth/auth.controller";
import { globalErrorHandling } from './utils/response/error.response';
import connectBD from './DB/connection.db';


   const limiter = rateLimit({  
         windowMs:60 * 60000,
         limit: 2000, 
         message: "Too many requests from this IP, please try again later.",
         statusCode: 429,
        });
 
   const bootstrap = async (): Promise<void> => {
   const app: Express  =  express(); 
   const port = process.env.PORT || 5000;

     app.use(cors(), express.json(), helmet(), limiter);

     app.get("/", (req: Request, res: Response )  => {
     res.json({ message: `Welcome To ${process.env.APPLICATION_NAME}` });
});


   //sub-app-router
     app.use("/auth", authController)

     app.use("{/*dummy}", (req: Request, res: Response) => { 
     res.status(404).json({ message: "Invalid Application Routing " });  

    });


     app.use(globalErrorHandling);
 
      

     await connectBD();

     app.listen(port, () => {
     console.log(`Server is running on port:${port}`);

    });
    };


    export default bootstrap;