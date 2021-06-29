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

  console.log(req.query.page);
  const localization = {
    lat: 50.2252137,
    lon: 23.3854938
  }

  const radius = 10000 // in meters
  let perPage = 4;

  try {
    let places = await Place.aggregate([
      {
        $geoNear: {
          near: { "coordinates": [23.3854938, 50.2252137] },
          distanceField: "distance",
          maxDistance: 10000,
          key: "location",
          includeLocs: "dist.location",
          spherical: "true"
        }
      },
      { $limit: req.query.page * perPage + perPage }, { $skip: req.query.page * perPage }
    ]);
    console.log(places);
    res.json(places);
  } catch (error) {
    res.json(error.message)
  }

});

placesRouter.get('/suggested', logged, async (req, res) => {

  console.log(req.query.page);
  let perPage = 4;

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
          near: { "coordinates": [23.3854938, 50.2252137] },
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
      { $limit: req.query.page * perPage + perPage }, { $skip: req.query.page * perPage },
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
          near: { "coordinates": [23.3854938, 50.2252137] },
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
