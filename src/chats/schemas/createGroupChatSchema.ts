import joi from "joi";

export const createGroupChatSchema = joi.object({
  name: joi.string().required(),
});
