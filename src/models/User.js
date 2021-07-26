import { model, Schema} from "mongoose";

const userSchema = new Schema({
    name: {
        type: String,
        trim: true,
        unique: true,
        required: "Name is required",
        max: 255,
        min: 4
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: 'Email address is required',
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
        max: 255,
        min: 4
    },
    password: {
        type: String,
        required: true,
        max: 1000,
        min: 6
    },
    location: [{type: Number}, {type: Number}],
}, { timestamps: true });

const User = model("User", userSchema);

export {User, userSchema};