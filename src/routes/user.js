import { Router } from "express";
import Joi from "joi";
import { User } from "../models/User";
import { registrationValidate } from "../validations/user";
let userRouter = Router();

userRouter.post('/register', async (req, res) => {

    const error = registrationValidate(req.body);

    if (error) res.status(400).send({ error: error });

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    });

    try {

        const newUser = await user.save();
        res.send(newUser);
    } catch (error) {
        if (error instanceof TypeError) {
            res.status(400).send({ name: error.name, message: error.message, body: req.body });
        } else {
            res.status(400).send(error);
        }
    }
});

export { userRouter };