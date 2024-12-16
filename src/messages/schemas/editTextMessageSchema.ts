import joi from "joi"

export const editTextMessageSchema = joi.object({
    messageId: joi.string().required(),
    newMessage: joi.string().required()
})