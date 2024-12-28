import joi from "joi"

export const getMessageLikesSchema = joi.object({
    messageId: joi.string().required()
})