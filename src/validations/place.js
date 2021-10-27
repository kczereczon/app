import Joi from "joi";

export function createPostValidation(data) {
    const schema = Joi.object({
        name: Joi.string().min(4).max(255).required(),
        lat: Joi.number().min(-90).max(90).required(),
        lon: Joi.number().min(-180).max(180).required(),
        description: Joi.string().min(4).max(3000).required(),
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        number: Joi.string().optional(),
        postal_code: Joi.string().optional(),
        image: Joi.object().required(),
    })

    const { error } = schema.validate(data);
    if(error) return error.details[0].message; else return null;
}