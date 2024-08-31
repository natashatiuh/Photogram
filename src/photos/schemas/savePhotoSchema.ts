import joi from "joi"

export const savePhotoSchema = joi.object({
    photoId: joi.string()
})