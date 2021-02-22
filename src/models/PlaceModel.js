import { placeSchema } from "../schemas/PlaceSchema";
import { model } from "mongoose";

const Place = model("Place", placeSchema);

export {Place};