import joi from "joi"

export const changeUserFullNameSchema = joi.object({
    newUserFullName: joi.string().required()
})