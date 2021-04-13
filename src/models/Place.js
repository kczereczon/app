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
        max: 2000,
        min: 4
    },
    tags: [String],
    address: {
        street: {type: String},
        number: {type: String},
        postal_code: {type: String},
        city: {type: String}
    },
    image: {type: String},
    lat: {type: Number},
    lng: {type: Number},
    other_tags: [String],
    rating: {type: Number}
}, { timestamps: true });

const Place = model("Place", placeSchema);

export {Place, placeSchema};