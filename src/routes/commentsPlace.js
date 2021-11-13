import { Router } from "express";
import { logged } from "../middlewares/logged";
import { CommentPlace } from "../models/CommentPlace";
import { Place } from "../models/Place";
import { Post } from "../models/Post";
import { createCommentPlaceValidation } from "../validations/commentPlace";


let commentsPlaceRouter = Router();

commentsPlaceRouter.put('/:id', [logged], async (req, res) => {
    let user = req.user;
    let newDescription = req.body.description;
    console.log(newDescription);

    let comment = await CommentPlace.findById(req.params.id);

    if (!comment) { return res.status(404).send({ error: "Comment not found" }) };
    if (!comment.user._id.equals(user._id)) { return res.status(401).send({ error: "You don't have permission to perform that action." }) }

    comment.description = newDescription;

    try {
        await comment.save();
        return res.send(comment);
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
});

commentsPlaceRouter.delete('/:id', logged, async (req, res) => {
    let user = req.user;
    let comment = await CommentPlace.findById(req.params.id);

    if (!comment) { return res.status(404).send({ error: "Comment not found" }) };
    if (!comment.user._id.equals(user._id)) { return res.status(401).send({ error: "You don't have permission to perform that action." }) }

    try {
        let response = await comment.delete();
        return res.send({ status: true });
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
});

commentsPlaceRouter.post('/', [logged], async function (req, res) {
    let user = req.user;

    const error = createCommentPlaceValidation(req.body);
    if (error) return res.status(400).send({ error: error });


    try {
        let place = await Place.findById(req.body.place_id);
        if(!place) { return res.status(404).send({ error: "Place not found."})};

        const comment = new CommentPlace({
            user: user,
            place: place,
            // rating: rating,
            description: req.body.description,
        });

        const newComment = await comment.save();
        return res.send(newComment);
    } catch (error) {
        console.log(error.message);
    }
})

commentsPlaceRouter.get('/place/:id', [logged], async (req, res) => {
    let place = await Place.findById(req.params.id);
    if(!place) { return res.status(404).send({ error: "Place not found."})};

    try {
        let comments = await CommentPlace.find({place: req.params.id})

        return res.send(comments);
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
});

export { commentsPlaceRouter };