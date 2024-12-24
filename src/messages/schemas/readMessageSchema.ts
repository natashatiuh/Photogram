import joi from "joi"

export const readMessageSchema = joi.object({
    messageId: joi.string().required()
})