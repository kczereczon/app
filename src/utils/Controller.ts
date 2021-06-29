import express from 'express';

export default abstract class Controller {

    public endpoint: string;
    public router: express.Router;

    constructor(endpoint: string) {
        this.endpoint = endpoint;
        this.router = express.Router();
        this.registerRoute();
    }

    abstract registerRoute(): void;
}