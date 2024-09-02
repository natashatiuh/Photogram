import joi from "joi"

export const unlikePhotoSchema = joi.object({
    photoId: joi.string().required()
})