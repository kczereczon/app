import { model, Schema} from "mongoose";

const commentPlaceSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    description: {
        type: String
    },
    rating: {
        type: Number
    },
    place: {type: Schema.Types.ObjectId,
        ref: "User"}
},{ timestamps: true })

const CommentPlace = model("CommentPlace", commentPlaceSchema);

export {CommentPlace, commentPlaceSchema};