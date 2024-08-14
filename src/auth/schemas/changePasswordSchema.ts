import joi from "joi" 

export const changePasswordSchema = joi.object({
    currectPassword: joi.string().required(),
    newPassword: joi.string().required()
})