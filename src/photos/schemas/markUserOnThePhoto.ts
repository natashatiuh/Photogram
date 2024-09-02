import joi from "joi"

export const markUserOnThePhotoSchema = joi.object({
    photoId: joi.string().required(),
    markedUser: joi.string().required()
})