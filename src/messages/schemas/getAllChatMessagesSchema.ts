import joi from "joi";

export const getAllChatMessagesSchema = joi.object({
  chatId: joi.string().required(),
});
