import { Router } from "express";
import { Place } from "../models/Place";
// import cors from "cors"

export const placesRouter = Router();

placesRouter.get('/nodes', async (req, res) => {

    try {
        var nodes = [];

        let tags = await Place.find().distinct('tags');
        let places = await Place.find();

        tags.forEach(tag => {
            nodes.push({ id: tag, color: 'blue', r: 8 });
        })

        places.forEach(place => {
            if (place.tags.length) {
                nodes.push({ id: place.name, color: 'green', r: 10 });
            }
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
            if (place.tags.length) {
                place.tags.forEach(tag => {
                    links.push({ target: tag, source: place.name, value: 2 })
                })
            }
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

placesRouter.get('/around', async (req, res) => {

    const localization = {
        lat: 50.3487476,
        lon: 23.3369131
    }

    const radius = 10000 // in meters

    try {
        // let places = await Place.find({
        //     location:
        //     {
        //         $near:
        //         {
        //             $geometry: {
        //                 coordinates: [23.3369131, 50.3487476]
        //             },
        //             $maxDistance: radius,
        //             distanceField: "distance"
        //         }
        //     }
        // })

        let places = await Place.aggregate([
            {
                $geoNear: {
                near: {"coordinates": [23.3369131, 50.3487476] },
                distanceField: "distance",
                maxDistance: 10000,
                key: "location",
                includeLocs: "dist.location",
                spherical: "true"
                }
            }
        ]);

        res.json(places);
    } catch (error) {
        res.json(error.message)
    }

});

