import joi from "joi"

export const changeEmailSchema = joi.object({
    newEmail: joi.string().required()
})