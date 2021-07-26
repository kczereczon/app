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

placesRouter.get('/find-route', logged, async (req, res) => {
    let lat = req.body.lat;
    let lon = req.body.lon;

    console.log(lat, lon);

    let distance = req.body.distance;
    let time = req.body.maxTime;
    let type = req.body.type;
    let all = req.body.all;
    let limit = req.body.limit || null;

    req.user.location = [lon, lat];

    await req.user.save();

    try {
        var lastTags = await getLastTags(req.user, 1000);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message, code: 1001 });
    }

    try {
        var places = await getNearPlaces(req.user, distance, limit);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message, code: 1002 });
    }

    let placesWithLikePercentage = [];
    const countOfTags = Object.values(lastTags).reduce((a, b) => a + b);

    places.forEach(place => {
        let percentage = 0;

        place.tags.forEach(tag => {
            if(lastTags[tag]) {
                percentage += lastTags[tag] / countOfTags;
            }
        });

        placesWithLikePercentage.push({percentage: percentage, id: place._id, distance: place.distance})
    });

    let minPercentage = Math.min.apply(Math, placesWithLikePercentage.map(function(o) { return o.percentage; }))
    let maxPercentage = Math.max.apply(Math, placesWithLikePercentage.map(function(o) { return o.percentage; }))

    let minDistance = Math.min.apply(Math, placesWithLikePercentage.map(function(o) { return o.distance; }))
    let maxDistance = Math.max.apply(Math, placesWithLikePercentage.map(function(o) { return o.distance; }))

    placesWithLikePercentage.sort((a, b) => {

        let percentageDiff = b.percentage - a.percentage;
        let percentageParam = (percentageDiff - minPercentage) / (maxPercentage - minPercentage);

        let distanceDiff = a.distance - b.distance;
        let distanceParam = (distanceDiff - minDistance) / (maxDistance - minDistance);

        return percentageParam * 0.2 + distanceParam * 0.8;
    });

    return res.status(200).json({ lastTags, placesWithLikePercentage });
})

let getLastTags = async (user, limit) => {
    let tags = await UserTag.aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: 20 },
        {
            $group: {
                _id: "$tag",
                count: { $sum: 1 }
            }
        },
        { $match: { user: Schema.Types.ObjectId(user._id) } },

    ]);

    let mappedTags = {}

    tags.forEach(tag => {
        mappedTags[tag._id] = tag.count;
    });

    return mappedTags;
}

let getNearPlaces = async (user, distance, limit) => {
    console.log(user.location);
    return await Place.aggregate([
        {
            $geoNear: {
                near: { "coordinates": user.location },
                distanceField: "distance",
                maxDistance: parseInt(distance),
                key: "location",
                includeLocs: "dist.location",
                spherical: "true"
            }
        },
    ]);
}

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
            { $limit: 10 }
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
            { $sort: { createdAt: -1 } },
            { $limit: 20 },
            {
                $group: {
                    _id: "$tag",
                    count: { $sum: 1 }
                }
            },
            { $match: { user: Schema.Types.ObjectId(req.user._id) } },

        ]);

        console.log(lastTags);

        let tags = [];

        lastTags.sort((a, b) => {
            return b.count - a.count;
        });

        lastTags = lastTags.slice(0, 6);

        lastTags.forEach(tag => {
            tags.push(tag._id)
        });

        let whereTags = [];

        combRep(tags, 3).forEach(item => {
            whereTags.push({ tags: { $all: item } });
        })

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
                $addFields: {
                    machingTags: {
                        $size: {
                            $filter: {
                                input: "$tags",
                                as: "tag",
                                cond: { $in: ["$$tag", tags] }
                            }
                        }
                    }
                }
            },
            {
                $match:
                {
                    $or: whereTags
                }
            },
            { $limit: 10 },
            { $sort: { machingTags: -1 } }
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

placesRouter.get('/users/tags', logged, async (req, res) => {

    try {
        let lastTags = await UserTag.aggregate([
            { $sort: { createdAt: -1 } },
            { $limit: 50 },
            {
                $project: {
                    name: 1,
                    createdAt: 1,
                    tag: 1
                }
            },
            {
                $group: {
                    _id: "$tag",
                    count: { $sum: 1 }
                }
            },
            { $match: { user: Schema.Types.ObjectId(req.user._id) } },

        ]);

        lastTags.sort((a, b) => {
            return b.count - a.count;
        });

        lastTags = lastTags.slice(0, 3);

        console.log(lastTags);

        let tags = []

        lastTags.forEach(({ _id }) => {
            tags.push(_id);
        });

        res.json(tags);
    } catch (error) {
        res.json(error.message)
    }

});

placesRouter.get('/byTag/:tag', async (req, res) => {
    try {
        let places = await Place.aggregate([
            {
                $geoNear: {
                    near: { "coordinates": [23.3369131, 50.3487476] },
                    distanceField: "distance",
                    maxDistance: 20000000,
                    key: "location",
                    includeLocs: "dist.location",
                    spherical: "true"
                }
            },
            {
                $match:
                {
                    tags: { $all: [req.params.tag] }
                }
            },
            { $limit: 10 },
        ]);

        res.json(places);
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