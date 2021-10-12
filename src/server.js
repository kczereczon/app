import { initDatabase } from "./core/database";
import dotenv from "dotenv";
import { app } from "./app";

//load env files
dotenv.config();

//initialization mongodb
let connection = initDatabase();

connection.then(() => {
    app.listen(80, () => {
        console.log("Server running on http://localhost:3333");
    });
}).catch((error) => {
    console.log(error);
});
