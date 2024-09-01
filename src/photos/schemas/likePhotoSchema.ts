import joi from "joi"

export const likePhotoSchema = joi.object({
    photoId: joi.string().required()
})