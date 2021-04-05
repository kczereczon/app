import { response, Router } from "express";
import { categorize, taggorize } from "../core/imagga";

const viewsRouter = new Router();

viewsRouter.get('/add-place', (req, res) => {
    res.render('tagging', { categories: [], tags: [], image: "" });
})

viewsRouter.post('/add-place', async (req, res) => {
    try {
        var imaggaTagsResponse = await taggorize(req.body.base64);
        var imaggaCategoryResponse = await categorize(req.body.base64);
    } catch (error) {
        res.json(error);
    }
    console.log(imaggaCategoryResponse.result.categories);

    res.render('tagging', {
        categories: imaggaCategoryResponse.result.categories,
        tags: imaggaTagsResponse.result.tags,
        image: req.body.base64
    });
})

export { viewsRouter }