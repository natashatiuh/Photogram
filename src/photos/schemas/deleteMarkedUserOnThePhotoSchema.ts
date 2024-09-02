import joi from "joi"

export const deleteMarkedUserOnThePhotoSchema = joi.object({
    photoId: joi.string().required(),
    markedUser: joi.string().required()
})