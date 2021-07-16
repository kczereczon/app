import { model, Schema} from "mongoose";

const commentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    likes: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }   
    ],
    description: {
        type: String
    }
},{ timestamps: true })

const Comment = model("Comment", commentSchema);

export {Comment, commentSchema};