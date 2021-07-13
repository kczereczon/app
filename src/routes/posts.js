import { Router } from "express";
import { logged } from "../middlewares/logged";
import { createPostValidation } from "../validations/post"
import multer from "multer";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import { taggorizeUrl } from "../core/imagga";
import { Post } from "../models/Post";
import { Place } from "../models/Place";


let postsRouter = Router();
let upload = multer();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

postsRouter.post('/', [logged, upload.single('image')], async function (req, res) {
    let user = req.user;
    req.body.image = req.file;

    const error = createPostValidation(req.body);
    if (error) return res.status(400).send({ error: error });

    let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            let stream = cloudinary.v2.uploader.upload_stream({
                folder: "posts"
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
        let tags = await taggorizeUrl(result.url);

        try {

            const post = new Post({
                image: result.url,
                user: req.user,
                place: await Place.findOne({_id: req.body.place_id}),
                description: req.body.description
            });
    
            const newPost = await post.save();
            res.send(post);
        } catch (error) {
            if (error instanceof TypeError) {
                return res.status(400).send({ name: error.name, message: error.message, body: req.body });
            } else {
                return res.status(400).send(error);
            }
        }

        res.send(tags);

    } catch (error) {
        res.send(error.message);
    }
})

export { postsRouter };