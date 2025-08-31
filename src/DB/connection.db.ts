

import {connect} from "mongoose";
import { UserModel } from "./model/User.model";

const connectBD = async () => {
  try {
    const result = await connect(process.env.DB_URL as string  ,{
        serverSelectionTimeoutMS: 50000,
  });

  await UserModel.syncIndexes();
  console.log(result.models);
  console.log("DataBase Connected Successfully");
  } catch (error) {
    
    console.log("Database Connection Failed");
    console.log(error); 
    
  }
}
export default connectBD;