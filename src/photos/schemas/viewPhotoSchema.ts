import joi from "joi";

export const viewPhotoSchema = joi.object({
  photoId: joi.string().required(),
});
