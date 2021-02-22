import { Router } from "express";
import * as CategoryController from "../controllers/CategoryController";
let router = Router();

router.get('/', (req, res) => {
    res.send("laira server");
})

router.post('/category', async (req, res) => {
    let response = await CategoryController.create("test");
    res.json({
        "created": response
    });
})

router.get('/category', async (req, res) => {
    let response = await CategoryController.all();
    res.json({
        "response": response
    });
});

router.delete('/category/:categoryId', async (req, res) => {
    let response = await CategoryController.remove(req.params.categoryId);
    res.json({
        "deleted": response
    });
})
export {router};