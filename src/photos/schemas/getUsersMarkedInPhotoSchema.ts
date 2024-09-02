import joi from "joi"

export const getUsersMarkedInPhotoSchema = joi.object({
    userId: joi.string().required()
})