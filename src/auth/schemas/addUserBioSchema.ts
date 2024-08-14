import joi from "joi"

export const addUserBioSchema = joi.object({
    bio: joi.string().required()
})