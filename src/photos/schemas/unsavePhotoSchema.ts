import joi from "joi"

export const unsavePhotoSchema = joi.object({
    photoId: joi.string().required()
})