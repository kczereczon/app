import { model, Schema} from "mongoose";

const placeSchema = new Schema({
    name: {
        type: String,
        trim: true,
        unique: true,
        required: "Name is required",
        max: 255,
        min: 4
    },
    description: {
        type: String,
        trim: true,
        required: "Description is required",
        max: 2000,
        min: 4
    },
    category: {
        type: String,
        trim: false,
        required: "Category is required",
        max: 255,
        min: 3
    },
    tags: [String],
    address: {
        street: {type: String},
        number: {type: String},
        postal_code: {type: String},
        city: {type: String}
    }
}, { timestamps: true });

const Place = model("Place", placeSchema);

export {Place, placeSchema};