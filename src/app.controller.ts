
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
import { genderEnum, HUserDocument, UserModel } from './DB/model/User.model';
import { UserRepository } from './DB/repository/user.repository';
import { Types } from 'mongoose';

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

     //hooks

     async function test() {
      try {
 
        
      //     const userModel = new UserRepository(UserModel);
      //       const user = await userModel.findByIdAndUpdate({
      //   id:"68c97f83c801fb79a2f97cc4" as unknown as Types.ObjectId ,
      //   update:{
      //     freezedAt:new Date(),
      //   } ,
      // });

      //   const userModel = new UserRepository(UserModel);
      //       const user = await userModel.find({
      //   filter: { paranoid: false }  ,
      //   options:{skip:0 , limit:2} ,
      // });

        // const user = new UserModel({
        //   username:"yehia khaled",
        //   email:`${Date.now()}@gmail.com`,
        //   password:"123456",
        // });
        // await user.save();
        // user.extra = {name : "ayhaga"};
    
        // await user.save();
// ----------------------------------------------------

        // const userModel = new UserRepository(UserModel);
      //   const user = ( await userModel.findOne({
           
      //      filter:{} ,
           
      //     // select:"extra.name"
      //   }))as HUserDocument;
      //   console.log(user);
        
      //     user.gender = genderEnum.male;
          
      //  await user.save();
        //
        // ---------------------------------------------------------------- 
      // const userModel = new UserRepository(UserModel);
      // const user = await userModel.findOne({filter :{} }) as HUserDocument;
      // await user.updateOne({lastName:"lolol"})

      //    const userModel = new UserRepository(UserModel);
      // const user = await userModel.findOne({filter :{} }) as HUserDocument;
      // await user.deleteOne({})
// -----------------------------------------------------------------------------
        

      // const userModel = new UserRepository(UserModel);
      // const user =( await userModel.findOne({
      //   filter: {gender:genderEnum.female , paranoid:false} ,
      // })) as HUserDocument;

      //   const user = ( await userModel.findById({
      //  id:"68c97f83c801fb79a2f97cc4"as unknown as Types.ObjectId  ,
      //  options:{lean:true}
      // })) as HUserDocument;

      // -------------------------------------------------------------------

      //  const userModel = await new UserRepository(UserModel);
      //   const user = await userModel.updateOne
      //   ({
      //     filter:{_id:"68c97f83c801fb79a2f97cc4" }
      //   ,update:
      //    { freezedAt:new Date()}
      //   })

      // -------------------------------------------------------------------

        // const userModel = new UserRepository(UserModel);
        // const user = await userModel.findOneAndDelete
        // ({
        //   filter:{_id:"68cc5183a24db6d75ac26e69" as unknown as Types.ObjectId}
        // })

        // ----------------------------------------------------------------

        const userModel = new UserRepository(UserModel);
      const user = await userModel.insertMany({
        data:[
        {
         username:"yehia khaled" ,
         email:`${Date.now()}@gmail.com` ,
        password:"123456"
        },
      //      {
      //    username:"yehia khaled" ,
      //    email:`${Date.now()}323@gmail.com` ,
      //   password:"123456"
      //   }
      ]})
      console.log( {result :user});
      } catch (error) {
        console.log(error); 
        
      }}
    
        test();

     app.listen(port, () => {
     console.log(`Server is running on port:${port}`);

    });
    };


    export default bootstrap;