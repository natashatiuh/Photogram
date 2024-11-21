import joi from "joi";

export const deleteChatCoverSchema = joi.object({
  chatId: joi.string().required(),
});
