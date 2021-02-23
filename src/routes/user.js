import { Router } from "express";
import { User } from "../models/User";
let userRouter = Router();

userRouter.post('/register', async (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });
        const newUser = await user.save();
        res.send(newUser);
    } catch (error) {
        if (error instanceof TypeError) {
            res.status(400).send({name: error.name, message: error.message, body: req.body});
        } else {
            res.status(400).send(error);
        }
    }
});

export { userRouter };