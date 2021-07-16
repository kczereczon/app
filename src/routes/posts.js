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

postsRouter.put('/:id', [logged], async (req, res) => {
    let user = req.user;
    let newDescription = req.body.description;
    console.log(newDescription);

    let post = await Post.findById(req.params.id);

    if(!post) { return res.status(404).send({error: "Post not found"})};
    if(!post.user._id.equals(user._id)) {return res.status(401).send({error: "You don't have permission to perform that action."})}

    post.description = newDescription;
    
    try {
        await post.save();
        return res.send(post);
    } catch (error) {
        return res.status(500).send({error: error.message});
    }
});

postsRouter.delete('/:id', logged, async (req, res) => {
    let user = req.user;
    let post = await Post.findById(req.params.id);

    if(!post) { return res.status(404).send({error: "Post not found"})};
    if(!post.user._id.equals(user._id)) { return res.status(401).send({error: "You don't have permission to perform that action."})}

    try {
        let response = await post.delete();
        return res.send({status: true});
    } catch (error) {
        return res.status(500).send({error: error.message});
    }
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
                user: user,
                place: await Place.findOne({_id: req.body.place_id}),
                description: req.body.description,
                tags: tags.result.tags
            });
    
            const newPost = await post.save();
            return res.send(newPost);
        } catch (error) {
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

export { postsRouter };