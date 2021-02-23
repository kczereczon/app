import express from "express"
import { initDatabase } from "./core/database";
import dotenv from "dotenv";
import { userRouter } from "./routes/user";
import bodyParser from "body-parser";

//load env files
dotenv.config();

//initialization mongodb
let connection = initDatabase();

connection.then(() => {
    var app = express();
    
    var jsonParser = bodyParser.json()

    app.use('/api/user/', jsonParser, userRouter)

    app.listen(3333, () => {
        console.log("Server running on http://localhost:3333");
    })
}).catch((error) => {
    console.log(error);
});
