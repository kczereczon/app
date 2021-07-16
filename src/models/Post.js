import { model, Schema} from "mongoose";

const postSchema = new Schema({
    image: {
        type: String,
    },
    tags: [Object],
    place: {
        type: Schema.Types.ObjectId,
        ref: "Place"
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    description: {
        type: String,
        min: 4,
        max: 255
    },
    comments: [{
        type: Schema.Types.ObjectId,
        ref: "Comment",
    }],
    likes: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }]
},{ timestamps: true })

const Post = model("Post", postSchema);

export {Post, postSchema};