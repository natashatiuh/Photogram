import joi from "joi";

export const addParticipantToChatSchema = joi.object({
  chatId: joi.string().required(),
  participantId: joi.string().required(),
});
