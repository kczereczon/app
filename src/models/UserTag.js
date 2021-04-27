import { model, Schema} from "mongoose";

const userTagSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    tag: {
        type: String,
        trim: true,
        lowercase: true,
    },
}, { timestamps: true });

const UserTag = model("UserTag", userTagSchema);

export {UserTag, userTagSchema};