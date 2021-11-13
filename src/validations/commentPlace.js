import Joi from "joi";

export function createCommentPlaceValidation(data) {
    const schema = Joi.object({
        place_id: Joi.string().required(),
        rating: Joi.number().min(0).max(5).required(),
        description: Joi.string().min(4).max(255).required(),
    })

    const { error } = schema.validate(data);
    if(error) return error.details[0].message; else return null;
}