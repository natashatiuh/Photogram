import joi from "joi";

export const editGroupChatNameSchema = joi.object({
  newName: joi.string().required(),
  chatId: joi.string().required(),
});
