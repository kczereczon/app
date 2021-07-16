import Joi from "joi";

export function createCommentValidation(data) {
    const schema = Joi.object({
        post_id: Joi.string().required(),
        description: Joi.string().min(4).max(255).required(),
    })

    const { error } = schema.validate(data);
    if(error) return error.details[0].message; else return null;
}