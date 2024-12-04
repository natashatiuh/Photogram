import joi from "joi";

export const sendTextMessageSchema = joi.object({
  chatId: joi.string().required(),
  textContent: joi.string().required(),
});
