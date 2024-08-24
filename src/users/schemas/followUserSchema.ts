import joi from "joi"

export const followUserSchema = joi.object({
    followedId: joi.string().required()
})