import joi from "joi";

export const changeChatCoverSchema = joi.object({
  chatId: joi.string().required(),
  userId: joi.string().required(),
});
