import joi from "joi"

export const signUpUserSchema = joi.object({
    email: joi.string().required(),
    password: joi.string().required(),
    userName: joi.string().required(),
    fullName: joi.string().required(),
    age: joi.number().required()
})