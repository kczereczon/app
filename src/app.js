import bodyParser from "body-parser";
import express from "express";
import { userRouter } from "./routes/user";

var app = express();

var jsonParser = bodyParser.json()

app.use('/api/user/', jsonParser, userRouter)

export {app}

