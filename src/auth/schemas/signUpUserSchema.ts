import joi from "joi"

export const signUpUserSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required().min(8),
    userName: joi.string().required(),
    fullName: joi.string().required(),
    dateOfBirth: joi.date().required()
})