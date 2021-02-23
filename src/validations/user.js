import Joi from "joi";

export function registrationValidate(data) {
    const schema = Joi.object({
        name: Joi.string().min(4).max(255).required(),
        email: Joi.string().email().min(4).max(255).required(),
        password: Joi.string().required()
    })

    const { error } = schema.validate(data);
    if(error) return error.details[0].message; else return null;
}