import jwt from "jsonwebtoken";
import { Router } from "express";
import Joi from "joi";
import { User } from "../models/User";
import { loginValidate, registrationValidate } from "../validations/user";
import bcrypt from "bcrypt";
import { logged } from "../middlewares/logged";

let userRouter = Router();

userRouter.post('/register', async (req, res) => {

    const error = registrationValidate(req.body);

    if (error) res.status(400).send({ error: error });

    const emailExists = await User.findOne({email: req.body.email});
    if(emailExists) return res.status(400).send({error: "Email already exists"});

    const nameExists = await User.findOne({name: req.body.name});
    if(nameExists) return res.status(400).send({error: "Username already exists"});

    const genSalt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password, genSalt);

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: password
    });

    try {

        const newUser = await user.save();
        res.send(newUser);
    } catch (error) {
        if (error instanceof TypeError) {
            return res.status(400).send({ name: error.name, message: error.message, body: req.body });
        } else {
            return res.status(400).send(error);
        }
    }
});


userRouter.post('/login', async (req, res) => {
   const error = loginValidate(req.body);
   if(error) return res.status(400).send({error: "Invalid email or password"});
   
   const user = await User.findOne({email: req.body.email});
   if(!user) return res.status(400).send({error: "Invalid email or password"});

   const checkPassword = await bcrypt.compare(req.body.password, user.password);
   if(!checkPassword) return res.status(400).send({error: "Invalid email or password"});

   const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);

   return res.send({token: token});
})

userRouter.get('/details', logged, (req, res) => {
    return res.send({test: req.user});
})

export { userRouter };