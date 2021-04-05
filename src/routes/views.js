import { response, Router } from "express";

const viewsRouter = new Router();

viewsRouter.get('/add-place', (req, res) => {
    res.render('tagging', {category: null, tags: [], image: ""});
})

viewsRouter.post('/add-place', (req, res) => {
    res.render('tagging', {category: null, tags: [], image: req.body.base64});
})

export { viewsRouter }