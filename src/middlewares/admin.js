import jwt from "jsonwebtoken";
import { User } from "../models/User";

export async function admin (req, res, next) {
    try {
        const validate = jwt.verify(req.header('auth-token'), process.env.TOKEN_SECRET);
        const user = await User.findById(validate._id);
        if(!user || !user.admin) return res.status(401).send({error: "Access denied"});
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).send({error: "Access denied"});
    }
}