import express from "express"
import { validation } from "../common/middlewares/validation"
import { signUpUserSchema } from "./schemas/signUpUserSchema"
import { runInTransaction } from "../common/middlewares/transaction"
import { AuthRepository } from "./authRepository"
import { AuthService } from "./authService"
import { SignUpUserInput } from "./inputs/signUpUserInput"
import { signInUserSchema } from "./schemas/signInUserSchema"

export const router = express.Router()

router.post("/sign-up", validation(signUpUserSchema), async (req, res) => {
    try {
        const tokens = await runInTransaction(async (connection) => {
            const authRepository = new AuthRepository(connection)
            const authService = new AuthService(authRepository)

            const { email, password, userName, fullName, age } = req.body
            const userData = new SignUpUserInput(email, password, userName, fullName, age)

            const tokens = await authService.signUpUser(userData)
            return tokens
        })

        res.json({ tokens })
    } catch (error) {
        console.log(error)
        res.json({ success: false })
    }
})

router.get("/sign-in", validation(signInUserSchema), async (req, res) => {
    try {
        const tokens = await runInTransaction(async (connection) => {
            const authRepository = new AuthRepository(connection)
            const authService = new AuthService(authRepository)

            const { email, password } = req.body
            const tokens = await authService.signInUser(email, password)
            return tokens
        })

        res.json({ tokens })
    } catch (error) {
        console.log(error)
        res.json({success: false})
    }
})