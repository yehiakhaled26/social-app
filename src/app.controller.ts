
   import {  resolve } from 'node:path';    
   import { config } from 'dotenv';
   config ({ path: resolve("./config/.env.development") });

   import type { Express ,  Request,  Response } from "express";
   import express from "express";
   import cors from "cors";

   import helmet from "helmet";
   import {rateLimit} from "express-rate-limit";

   import authController from "./modules/auth/auth.controller";
   import { BadRequest, globalErrorHandling } from './utils/response/error.response';
   import connectBD from './DB/connection.db';
   import userController from './modules/user/user.controller';
  //  import {deleteFile , deleteFiles, deleteFolderByPrefix ,listDirectoryFiles} from './utils/multer/s3.config';
   import { createGetPreSignedLink, getFile } from './utils/multer/s3.config';
   import {promisify} from "node:util";
   import { pipeline } from 'node:stream';
  //  import { create } from 'node:domain';
   const createS3WriteStreamPipe = promisify(pipeline);




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
     app.use("/user", userController)

     app.get("/upload/*path" , async (req: Request, res: Response): Promise<void> => {
        
        const { downloadName , download = "false" } = req.query  as {downloadName? : string , download? : String };
        const {path} = req.params as unknown as {path : string[]};
        const Key = path.join("/");
        const s3Response = await getFile({Key});

        console.log(s3Response.Body);

           if (!s3Response?.Body) {
            throw new BadRequest("fail to fetch this assets");
        }

        res.setHeader("Content-Type", `${s3Response.ContentType || "application/octet-stream"}`);

        if (download === "true") {
            res.setHeader("content-Disposition", `attachment; filename="${downloadName || Key.split("/").pop()}"`);
        }

        res.setHeader("content-Disposition", `attachment; filename="${Key.split("/").pop()}"`
      );

        return await createS3WriteStreamPipe(
         s3Response.Body as NodeJS.ReadableStream, res)

     
     })

     app.get("/upload/pre-signed/*path" , 
            async (req: Request, res: Response): Promise<Response> => {
        const { downloadName , download = "false" ,expiresIn=120 } = req.query  as 
        {downloadName? : string ;
           download? : string;
           expiresIn? : number;
          };

        const {path} = req.params as unknown as {path : string[]};
        const Key = path.join("/");
        const url = await createGetPreSignedLink({ Key , downloadName: downloadName as string , download, expiresIn });

        return res.json({message : "success" , data :{url}})

      })
     

      // app.get("/test", async (req: Request, res: Response) => {
        // const { Key } = req.query as {Key : string};
        // const result = await deleteFile({ Key });

        // const result = await deleteFiles({ urls: ["test", "test2"] , Quiet : true });

      //   await deleteFolderByPrefix({ path: `users/` });
      //   return res.json({message : "success" , data :{}})
      // });

     
     app.use("{/*dummy}", (req, res) => { 
     res.status(404).json({ message: "Invalid Application Routing " });  

    });


     app.use(globalErrorHandling);
 
      

     await connectBD();

     app.listen(port, () => {
     console.log(`Server is running on port:${port}`);

    });
    };


    export default bootstrap;