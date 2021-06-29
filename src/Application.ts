import bodyParser from "body-parser";
import express from "express";
// import { userRouter } from "./controllers/User";
// import { viewsRouter } from "./routes/views";
import path from "path"
import { placesRouter } from "./controllers/places";
import cors from "cors"
import Controller from "./utils/Controller";
import UserController from "./controllers/User";

// var app = express();

// var jsonParser = bodyParser.json()

// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, '/views'));
// app.use(cors());

// app.use('/api/user/', jsonParser, userRouter)
// app.use('/api/places/', express.json(), placesRouter)
// app.use('/', express.urlencoded({limit: '50mb', extended: true}), viewsRouter)

// export {app}

export default class Application {

    private application: express.Application;
    private controllers: Controller[];


    constructor() {
        this.application = express();
        this.controllers = [
            new UserController()
        ]

        this.initControllers();
    }

    public initControllers() {
        this.controllers.forEach(controller => {
            this.application.use(controller.endpoint, controller.router);
        });
    }

    public start() {
        
    }
    
    /**
     * stop
     */
    public stop() {
        
    }

    public getApplication() : express.Application {
        return this.application;
    }

    public getControllers() : Controller[] {
        return this.controllers;
    }
}

