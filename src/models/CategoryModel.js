import { categorySchema } from "../schemas/CategorySchema";
import { model } from "mongoose";

const Category = model('Category', categorySchema);

export {Category};