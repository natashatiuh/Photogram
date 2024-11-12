import joi from "joi";

export const createOneToOneChatSchema = joi.object({
  senderId: joi.string().required(),
  recipientId: joi.string().required(),
  firstMessage: joi.string().required(),
});
