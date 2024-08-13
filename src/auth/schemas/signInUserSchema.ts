import joi from "joi"

export const signInUserSchema = joi.object({
    email: joi.string().required(),
    password: joi.string().required()
})
