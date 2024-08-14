import joi from "joi" 

export const changePasswordSchema = joi.object({
    currectPassword: joi.string().required().min(8),
    newPassword: joi.string().required().min(8)
})