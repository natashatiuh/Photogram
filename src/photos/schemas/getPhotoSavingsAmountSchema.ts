import joi from "joi"

export const getPhotoSavingsAmountSchema = joi.object({
    photoId: joi.string().required()
})