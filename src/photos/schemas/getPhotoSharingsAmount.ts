import joi from "joi"

export const getPhotoSharingsAmountSchema = joi.object({
    photoId: joi.string().required()
})