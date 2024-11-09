import joi from "joi";

export const getPhotoViewsSchema = joi.object({
  photoId: joi.string().required(),
});
