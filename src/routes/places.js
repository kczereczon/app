import { Router } from "express";
import { Schema } from "mongoose";
import { logged } from "../middlewares/logged";
import { Place } from "../models/Place";
import { UserTag } from "../models/UserTag";
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

placesRouter.get('/around', logged, async (req, res) => {

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
                    near: { "coordinates": [23.3369131, 50.3487476] },
                    distanceField: "distance",
                    maxDistance: 10000,
                    key: "location",
                    includeLocs: "dist.location",
                    spherical: "true"
                }
            },
            {$limit: 10}
        ]);

        res.json(places);
    } catch (error) {
        res.json(error.message)
    }

});

placesRouter.get('/suggested', logged, async (req, res) => {

    // const localization = {
    //     lat: 50.3487476,
    //     lon: 23.3369131
    // }

    try {
        console.log(req.user._id);
        let lastTags = await UserTag.aggregate([
            {
                $group: {
                    _id: "$tag",
                    count: { $sum: 1 }
                }
            },
            { $match: { user: Schema.Types.ObjectId(req.user._id) } },
            { $sort: { createdAt: -1 } },
            { $limit: 20 }
        ]);

        console.log(lastTags);

        let tags = [];

        lastTags.forEach(tag => {
            if(tag.count > 1) {
                tags.push(tag._id)
            }
        });

        let whereTags = [];

        combRep(tags, 3).forEach(item => {
            whereTags.push({tags: {$all: item}});
        })

        combRep(tags, 2).forEach(item => {
            whereTags.push({tags: {$all: item}});
        })

        combRep(tags, 1).forEach(item => {
            whereTags.push({tags: {$all: item}});
        })

        console.log(whereTags);

        let places = await Place.aggregate([
            {
                $geoNear: {
                    near: { "coordinates": [23.3369131, 50.3487476] },
                    distanceField: "distance",
                    maxDistance: 200000,
                    key: "location",
                    includeLocs: "dist.location",
                    spherical: "true"
                }
            },
            {
                $match:
                {
                    $or: whereTags
                }
            },
            {$limit: 10}
        ]);

        res.json(places);
    } catch (error) {
        res.json(error.message)
    }

});

placesRouter.get('/:id', logged, async (req, res) => {

    try {
        let place = await Place.findById(req.params.id);
        place.tags.forEach(async (tag) => {
            await UserTag.create({ user: req.user, tag: tag })
        });
        res.json(place);
    } catch (error) {
        res.json(error.message)
    }

});


function combRep(arr, l) {
    if (l === void 0) l = arr.length; // Length of the combinations
    var data = Array(l),             // Used to store state
        results = [];                // Array of results
    (function f(pos, start) {        // Recursive function
        if (pos === l) {                // End reached
            results.push(data.slice());  // Add a copy of data to results
            return;
        }
        for (var i = start; i < arr.length; ++i) {
            data[pos] = arr[i];          // Update data
            f(pos + 1, i);                 // Call f recursively
        }
    })(0, 0);                        // Start at index 0
    return results;                  // Return results
}
