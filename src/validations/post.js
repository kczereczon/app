import Joi from "joi";

export function createPostValidation(data) {
    const schema = Joi.object({
        image: Joi.object().required(),
        place_id: Joi.string().required(),
        description: Joi.string().min(4).max(255).required(),
    })

    const { error } = schema.validate(data);
    if(error) return error.details[0].message; else return null;
}