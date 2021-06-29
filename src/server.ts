import { initDatabase } from "./core/database";
import dotenv from "dotenv";
import Application from "./Application";

// load env files
dotenv.config();

// initialization mongodb
const connection = initDatabase();

connection.then(() => {
    const Application
    app.listen(3333, () => {
        console.log("Server running on http://localhost:3333");
    });
}).catch((error) => {
    console.log(error);
});
