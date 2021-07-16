import { Router } from "express";
import { logged } from "../middlewares/logged";
import { Post } from "../models/Post";
import { Comment } from "../models/Comment";
import { createCommentValidation } from "../validations/comment";


let commentsRouter = Router();

commentsRouter.put('/:id', [logged], async (req, res) => {
    let user = req.user;
    let newDescription = req.body.description;
    console.log(newDescription);

    let comment = await Comment.findById(req.params.id);

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

commentsRouter.delete('/:id', logged, async (req, res) => {
    let user = req.user;
    let comment = await Comment.findById(req.params.id);

    if (!comment) { return res.status(404).send({ error: "Comment not found" }) };
    if (!comment.user._id.equals(user._id)) { return res.status(401).send({ error: "You don't have permission to perform that action." }) }

    try {
        let response = await comment.delete();
        return res.send({ status: true });
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
});

commentsRouter.post('/', [logged], async function (req, res) {
    let user = req.user;

    const error = createCommentValidation(req.body);
    if (error) return res.status(400).send({ error: error });


    try {
        let post = await Post.findById(req.body.post_id);
        if(!post) { return res.status(404).send({ error: "Post not found."})};

        const comment = new Comment({
            user: user,
            post: post,
            description: req.body.description,
        });

        const newComment = await comment.save();
        return res.send(newComment);
    } catch (error) {
        console.log(error.message);
    }
})

export { commentsRouter };