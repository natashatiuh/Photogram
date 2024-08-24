import express from "express"
import { validation } from "../common/middlewares/validation"
import { signUpUserSchema } from "./schemas/signUpUserSchema"
import { runInTransaction } from "../common/middlewares/transaction"
import { AuthRepository } from "./authRepository"
import { AuthService } from "./authService"
import { SignUpUserInput } from "./inputs/signUpUserInput"
import { signInUserSchema } from "./schemas/signInUserSchema"
import { auth } from "../common/middlewares/auth"
import { MyRequest } from "../common/requestDefinition"
import { changeEmailSchema } from "./schemas/changeEmailSchema"
import { changePasswordSchema } from "./schemas/changePasswordSchema"

export const router = express.Router()

router.post("/sign-up", validation(signUpUserSchema), async (req, res) => {
    try {
        const tokens = await runInTransaction(async (connection) => {
            const authRepository = new AuthRepository(connection)
            const authService = new AuthService(authRepository)

            const { email, password, userName, fullName, dateOfBirth } = req.body
            const userData = new SignUpUserInput(email, password, userName, fullName, dateOfBirth)

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

router.patch("/email", validation(changeEmailSchema), auth(), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const authRepository = new AuthRepository(connection)
            const authService = new AuthService(authRepository)

            const { newEmail } = req.body
            const wasEmailChanged = await authService.changeEmail((req as MyRequest).userId, newEmail)
            if (!wasEmailChanged) {
                res.json({ success: false })
            } else {
                res.json({ success: true })
            }
        })
    } catch (error) {
        res.json({ success: false })
    }
})

router.patch("/password", validation(changePasswordSchema), auth(), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const authRepository = new AuthRepository(connection)
            const authService = new AuthService(authRepository)

            const { currentPassword, newPassword } = req.body
            const wasPasswordChanged = await authService.changePassword((req as MyRequest).userId, currentPassword, newPassword)
            if(!wasPasswordChanged) {
                res.json({ success: false })
            } else {
                res.json({ success: true })
            }
        })
    } catch (error) {
        console.log(error)
        res.json({ success: false })
    }
})

router.delete("/", auth(), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const authRepository = new AuthRepository(connection)
            const authService = new AuthService(authRepository)

            const wasUserDeleted = await authService.deleteUser((req as MyRequest).userId)
            if(!wasUserDeleted) {
                res.json({success: false})
            } else {
                res.json({ success: true })
            }
        })
    } catch (error) {
        console.log(error)
        res.json({ success: false })
    }
})

