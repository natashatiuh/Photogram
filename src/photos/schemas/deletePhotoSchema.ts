import joi from "joi"

export const deletePhotoSchema = joi.object({
    photoId: joi.string().required()
})