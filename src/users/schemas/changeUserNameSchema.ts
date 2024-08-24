import joi from "joi" 

export const changeUserNameSchema = joi.object({
    newUserName: joi.string().required()
})