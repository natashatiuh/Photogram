import joi from "joi"

export const likeMessageSchema = joi.object({
    messageId: joi.string().required()
})