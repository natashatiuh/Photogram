import joi from "joi";

export const deleteParticipantFromChatSchema = joi.object({
  chatId: joi.string().required(),
  participantId: joi.string().required(),
});
