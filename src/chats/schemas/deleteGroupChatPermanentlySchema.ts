import joi from "joi";

export const deleteGroupChatPermanentlySchema = joi.object({
  chatId: joi.string().required(),
});
