import { response, Router } from "express";
import { categorize, taggorize } from "../core/imagga";
import { Place } from "../models/Place";

const viewsRouter = new Router();

viewsRouter.get('/add-place', (req, res) => {
    res.render('tagging', { categories: [], tags: [], image: "" });
})

viewsRouter.post('/add-place', async (req, res) => {
    try {
        var imaggaTagsResponse = await taggorize(req.body.base64);
        var imaggaCategoryResponse = await categorize(req.body.base64);
    } catch (error) {
        return res.json(error);
    }

    if (imaggaCategoryResponse.result) {
        var categories = imaggaCategoryResponse.result.categories;
    }

    var tags = [];
    imaggaTagsResponse.result.tags.forEach(({ tag, confidence }) => {
        if (confidence > 50) {
            tags.push(tag.en)
        }
    })

    //TODO: add updating instead of sending back
    const existingPlace = await Place.findOne({
        "address.street": req.body.street,
        "address.numer": req.body.number,
        "address.postal_code": req.body.postal_code,
        "address.city": req.body.city
    });
    if (existingPlace) return res.status(400).send({ error: "Place already exists" });

    console.log(tags);
    const place = new Place({
        name: req.body.name,
        description: req.body.description,
        address: {
            street: req.body.street,
            number: req.body.number,
            postal_code: req.body.postal_code,
            city: req.body.city
        },
        tags: tags,
        category: imaggaCategoryResponse.result.categories[0].name.en
    });

    try {
        const newPlace = await place.save();
        res.render('tagging', {
            categories: categories,
            tags: imaggaTagsResponse.result.tags,
            image: req.body.base64
        });
    } catch (error) {
        if (error instanceof TypeError) {
            res.status(400).send({ name: error.name, message: error.message, body: req.body });
        } else {
            res.status(400).send(error);
        }
    }
})

export { viewsRouter }