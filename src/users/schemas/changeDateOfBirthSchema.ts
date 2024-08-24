import joi from "joi"

export const changeDateOfBirthSchema = joi.object({
    newDate: joi.date().required()
})