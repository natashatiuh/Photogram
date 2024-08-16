import joi from "joi"

export const unfollowUserSchema = joi.object({
    followedId: joi.string().required()
})