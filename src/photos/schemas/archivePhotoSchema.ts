import joi from "joi"

export const archivePhotoSchema = joi.object({
    photoId: joi.string().required()
})