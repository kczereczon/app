import { Router } from "express";
import { Place } from "../models/Place";

export const placesRouter = Router();

placesRouter.get('/nodes', async (req, res) => {

    try {
        var nodes = [];

        let tags = await Place.find().distinct('tags');
        let categories = await Place.find().distinct('category');
        let places = await Place.find();

        tags.forEach(tag => {
            nodes.push({id: tag, color: 'blue', r: 8});
        })

        places.forEach(place => {
            nodes.push({id: place.name, color: 'green', r: 10});
        })

        categories.forEach(category => {
            nodes.push({id: category, color: 'red', r: 20});
        })

        res.json(nodes)
    } catch (error) {
        res.json(error.message);
    }

})

placesRouter.get('/links', async (req, res) => {
    try {
        var links = [];
        let places = await Place.find();

        places.forEach(place => {
            console.log(place);
            place.tags.forEach(tag => {
                links.push({target: tag, source: place.name, value: 2})
            })
            links.push({source: place.category, target: place.name, value: 5})
        })

        res.json(links)
    } catch (error) {
        res.json(error.message);
    }
})

placesRouter.get('/', async (req, res) => {
    try {
        let tags = await Place.find();
        res.json(tags)
    } catch (error) {
        res.json(error);
    }
})

