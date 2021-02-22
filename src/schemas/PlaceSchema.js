import { Schema } from "mongoose";
import { categorySchema } from "./CategorySchema";

const placeSchema = new Schema({
    name: String,
    description: Text,
    categories: [
        {
            type: categorySchema
        }
    ]
});

export { placeSchema };