import joi from "joi"

export const getUsersMarkedInPhotoSchema = joi.object({
    photoId: joi.string().required()
})