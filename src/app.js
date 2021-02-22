import express from "express"
import { router } from "./routes/routes";
import { initDatabase } from "./core/database";
import dotenv from "dotenv";

//load env files
dotenv.config();

//initialization mongodb
let connection = initDatabase();

connection.then(() => {
    var app = express();

    app.use(router)

    app.listen(3333, () => {
        console.log("Server running on http://localhost:3333");
    })
}).catch((error) => {
    console.log(error);
});
