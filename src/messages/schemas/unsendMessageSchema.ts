import joi from "joi";

export const unsendMessageSchema = joi.object({
  messageId: joi.string().required(),
});
