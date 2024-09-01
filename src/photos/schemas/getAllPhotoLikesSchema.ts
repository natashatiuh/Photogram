import joi from "joi"

export const getAllPhotoLikesSchema = joi.object({
    photoId: joi.string().required()
})