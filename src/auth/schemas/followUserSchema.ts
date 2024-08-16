import joi from "joi"

export const followUserSchema = joi.object({
    userToFollow: joi.string().required()
})