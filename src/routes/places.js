import axios from "axios";
import { Router } from "express";
import { Schema } from "mongoose";
import mongoose from "mongoose";
import { logged } from "../middlewares/logged";
import { Place } from "../models/Place";
import { UserTag } from "../models/UserTag";
import polyline from "@mapbox/polyline";
import { admin } from "../middlewares/admin";
import { createPostValidation } from "../validations/place";
import multer from "multer";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import { taggorizeUrl } from "../core/imagga";
// import cors from "cors"

export const placesRouter = Router();

let upload = multer();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


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

placesRouter.get('/address/geocode', [logged], async (req, res) => {

    let lat = req.query.lat;
    let lon = req.query.lon;

    try {
        let response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?types=address&access_token=${process.env.MAPBOX_API_KEY}`);
        
        return res.status(200).json({ response: response.data });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message, code: 1003 })
    }
});

placesRouter.post('/find-route', logged, async (req, res) => {
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

    let user = req.user;

    try {
        var lastTags = await getLastTags(user, 1000);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message, code: 1001 });
    }

    try {
        var places = await getNearPlaces(user, distance, limit);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message, code: 1002 });
    }

    let placesWithLikePercentage = [];
    const countOfTags = Object.values(lastTags).reduce((a, b) => a + b);

    places.forEach(place => {
        let percentage = 0;

        place.tags.forEach(tag => {
            if (lastTags[tag]) {
                percentage += lastTags[tag] / countOfTags;
            }
        });

        placesWithLikePercentage.push({ ...place, percentage: percentage })
    });

    let minPercentage = Math.min.apply(Math, placesWithLikePercentage.map(function (o) { return o.percentage; }))
    let maxPercentage = Math.max.apply(Math, placesWithLikePercentage.map(function (o) { return o.percentage; }))

    let minDistance = Math.min.apply(Math, placesWithLikePercentage.map(function (o) { return o.distance; }))
    let maxDistance = Math.max.apply(Math, placesWithLikePercentage.map(function (o) { return o.distance; }))

    placesWithLikePercentage.sort((a, b) => {

        let percentageDiff = b.percentage - a.percentage;
        let percentageParam = (percentageDiff - minPercentage) / (maxPercentage - minPercentage);

        let distanceDiff = a.distance - b.distance;
        let distanceParam = (distanceDiff - minDistance) / (maxDistance - minDistance);

        return percentageParam * 0.2 + distanceParam * 0.8;
    });

    let slicedPlaces = placesWithLikePercentage.slice(0, 10);
    let coordinates = [req.user.location[0] + ',' + req.user.location[1]];

    slicedPlaces.forEach(place => {
        coordinates.push(place.location[0] + ',' + place.location[1]);
    })


    let coordinatesString = coordinates.join(';');

    try {
        let response = await axios.get(`https://api.mapbox.com/optimized-trips/v1/mapbox/${type}/${coordinatesString}?access_token=${process.env.MAPBOX_API_KEY}`);
        let geometry = response.data.trips[0].geometry;
        let geoJson = polyline.toGeoJSON(geometry);

        let counter = 0;
        let temporaryArray = [];
        for (let i = 1; i < response.data.waypoints.length; i++) {
            response.data.waypoints[i].place = slicedPlaces[counter++];
            temporaryArray[response.data.waypoints[i]['waypoint_index'] - 1] = response.data.waypoints[i];
        }

        response.data.waypoints = temporaryArray;

        return res.status(200).json({ response: response.data, geoJson: geoJson });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message, code: 1003 })
    }

    return res.status(200).json({ lastTags, placesWithLikePercentage });
})

let getLastTags = async (user, limit) => {
    let user_id = mongoose.Types.ObjectId(user._id);

    let tags = await UserTag.aggregate([
        { $match: { user: user_id } },
        { $sort: { createdAt: -1 } },
        { $limit: 20 },
        {
            $group: {
                _id: "$tag",
                count: { $sum: 1 }
            }
        },
    ]);

    let mappedTags = { }

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
                maxDistance: distance,
                key: "location",
                includeLocs: "dist.location",
                spherical: "true"
            }
        },
    ]);
}

placesRouter.get('/around', logged, async (req, res) => {
    //TODO: Remove hardcode
    try {
        let places = await Place.aggregate([
            {
                $geoNear: {
                    near: { "coordinates": req.user.location },
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

    let user_id = mongoose.Types.ObjectId(req.user._id);

    try {
        console.log(req.user._id);
        let lastTags = await UserTag.aggregate([
            { $match: { user: user_id } },
            { $sort: { createdAt: -1 } },
            { $limit: 20 },
            {
                $group: {
                    _id: "$tag",
                    count: { $sum: 1 }
                }
            },

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
                    near: { "coordinates": req.user.location },
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

placesRouter.get('/all', logged, async (req, res) => {
    try {
        let places = await Place.aggregate([
            {
                $geoNear: {
                    near: { "coordinates": req.user.location },
                    distanceField: "distance",
                    key: "location",
                    includeLocs: "dist.location",
                    spherical: "true"
                }
            },
            // {
            //     $match: {
            //         status: "active",
            //     }
            // }
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
        console.log('user: added tag');
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

placesRouter.get('/byTag/:tag', logged, async (req, res) => {
    try {
        let places = await Place.aggregate([
            {
                $geoNear: {
                    near: { "coordinates": req.user.location },
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

placesRouter.get('/pending', [logged, admin], async (req, res) => {
    try {
        let places = await Place.aggregate([
            {
                $match: {
                    status: 'pending'
                }
            }
        ]);
        res.json(places);
    } catch (error) {
        res.json(error.message)
    }

});

placesRouter.post('/accept/:id', [logged, admin], async (req, res) => {
    try {
        let place = await Place.findById(req.params.id);
        place.status = 'active';
        place.save();
        res.json(place);
    } catch (error) {
        res.json(error.message)
    }
});

placesRouter.post('/reject/:id', [logged, admin], async (req, res) => {
    try {
        let place = await Place.findById(req.params.id);
        place.status = 'rejected';
        place.save();
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

placesRouter.post('/', [logged, upload.single('image')], async (req, res) => {
    let user = req.user;
    req.body.image = req.file;
    console.log(req.body);

    const error = createPostValidation(req.body);
    if (error) return res.status(400).send({ error: error });

    let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            let stream = cloudinary.v2.uploader.upload_stream({
                folder: "places"
            },
                (error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                }
            );

            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
    };

    async function upload(req) {
        let result = await streamUpload(req);
        return result;
    }

    try {
        let result = await upload(req);

        console.log(result);

        let tags = await taggorizeUrl(result.url);

        try {

            const place = new Place({
                image: result.url,
                name: req.body.name,
                description: req.body.description,
                tags: tags.result.tags,
                location: [req.body.lat, req.body.lon],
                address: {
                    street: req.body.street,
                    number: req.body.number,
                    postal_code: req.body.postal_code,
                    city: req.body.city
                },
            });
    
            const placeCreated = await place.save();
            return res.send(placeCreated);
        } catch (error) {

            console.log(error);

            if (error instanceof TypeError) {
                return res.status(400).send({ name: error.name, message: error.message, body: req.body });
            } else {
                return res.status(400).send(error);
            }
        }

    } catch (error) {
        return res.send(error.message);
    }
})