import express from "express"
import { router } from "./routes/routes";

var app = express();

app.use(router)

app.listen(3333, () => {
    console.log("Server running on http://localhost:3333");
})