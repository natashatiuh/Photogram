import joi from "joi"

export const changePhotoDescription = joi.object({
    photoId: joi.string().required(),
    newDescription: joi.string()
})