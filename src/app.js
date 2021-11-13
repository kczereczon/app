import bodyParser from "body-parser";
import express from "express";
import { userRouter } from "./routes/user";
import { viewsRouter } from "./routes/views";
import path from "path"
import { placesRouter } from "./routes/places";
import cors from "cors"
import { postsRouter } from "./routes/posts";
import { commentsRouter } from "./routes/comments";
import { commentsPlaceRouter } from "./routes/commentsPlace";

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(cors());

app.use('/api/posts/', express.json(), postsRouter)
app.use('/api/comments/', express.json(), commentsRouter)
app.use('/api/comments/places/', express.json(), commentsPlaceRouter)
app.use('/api/user/', express.json(), userRouter)
app.use('/api/places/', express.json(), placesRouter)

app.use('/', express.urlencoded({ limit: '50mb', extended: true }), viewsRouter)

export { app }

