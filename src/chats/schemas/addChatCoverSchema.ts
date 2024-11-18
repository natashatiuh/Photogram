import joi from "joi";

export const addChatCoverSchema = joi.object({
  chatId: joi.string().required(),
  userId: joi.string().required(),
});
