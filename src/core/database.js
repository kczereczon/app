import { connect } from "mongodb";
import mongoose from "mongoose";

let initDatabase = () => {
    let connection = mongoose.connect(
        `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DATABASE}`,
        { useNewUrlParser: true }
    )
    
    return connection;
}

export {initDatabase}