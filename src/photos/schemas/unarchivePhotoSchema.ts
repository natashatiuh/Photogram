import joi from "joi"

export const unarchivePhotoSchema = joi.object({
    photoId: joi.string().required()
})