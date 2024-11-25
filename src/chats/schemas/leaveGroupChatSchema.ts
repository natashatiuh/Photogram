import joi from "joi";

export const leaveGroupChatSchema = joi.object({
  chatId: joi.string().required(),
});
