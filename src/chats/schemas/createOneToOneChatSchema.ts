import joi from "joi";

export const createOneToOneChatSchema = joi.object({
  recipientId: joi.string().required(),
});
