import express from "express"
import { validation } from "../common/middlewares/validation"
import { signUpUserSchema } from "./schemas/signUpUserSchema"
import { runInTransaction } from "../common/middlewares/transaction"
import { AuthRepository } from "./authRepository"
import { AuthService } from "./authService"
import { SignUpUserInput } from "./inputs/signUpUserInput"
import { signInUserSchema } from "./schemas/signInUserSchema"
import { changeUserNameSchema } from "./schemas/changeUserNameSchema"
import { auth } from "../common/middlewares/auth"
import { MyRequest } from "./requestDefinition"
import { changeUserFullNameSchema } from "./schemas/changeUserFullName"
import multer from "multer"
import path from "path"
import { v4 } from "uuid"

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images/avatars")
    }, 
    filename: (req, file, cb) => {
        cb(null, v4() + path.extname(file.originalname))
    },
})

const upload = multer({
    storage: storage
})

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

router.patch("/username", validation(changeUserNameSchema), auth(), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const authRepository = new AuthRepository(connection)
            const authService = new AuthService(authRepository)

            const {  newUserName } = req.body
            const wasUserNameChanged = await authService.changeUserName((req as MyRequest).userId, newUserName)

            if (!wasUserNameChanged) {
                res.send({ success: false })
            } else {
                res.send({ success : true })
            }

        })
    } catch (error) {
        console.log(error)
        res.send({ success: false })
    }
})

router.patch("/user-full-name", validation(changeUserFullNameSchema), auth(), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const authRepository = new AuthRepository(connection)
            const authService = new AuthService(authRepository)

            const { newUserFullName } = req.body
            const wasUserFullNameChanged = await authService.changeUserFullName((req as MyRequest).userId, newUserFullName)

            if (!wasUserFullNameChanged) {
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

router.patch("/avatar", auth(), upload.single('avatar'), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const authRepository = new AuthRepository(connection)
            const authService = new AuthService(authRepository)
            
            const avatar = req.file?.filename 
            const wasAvatarAdded = await authService.addAvatar((req as MyRequest).userId, avatar)
            if (!wasAvatarAdded) {
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
