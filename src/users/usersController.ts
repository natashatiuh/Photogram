import express from "express"
import { validation } from "../common/middlewares/validation"
import { runInTransaction } from "../common/middlewares/transaction"
import { changeUserNameSchema } from "../users/schemas/changeUserNameSchema"
import { auth } from "../common/middlewares/auth"
import { MyRequest } from "../common/requestDefinition"
import { changeUserFullNameSchema } from "../users/schemas/changeUserFullNameSchema"
import multer from "multer"
import path from "path"
import { v4 } from "uuid"
import { addUserBioSchema } from "../users/schemas/addUserBioSchema"
import { followUserSchema } from "../users/schemas/followUserSchema"
import { unfollowUserSchema } from "../users/schemas/unfollowUserSchema"
import { UsersRepository } from "./usersRepository"
import { UsersService } from "./usersService"
import { changeDateOfBirthSchema } from "./schemas/changeDateOfBirthSchema"

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

router.patch("/username", validation(changeUserNameSchema), auth(), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const usersRepository = new UsersRepository(connection)
            const usersService = new UsersService(usersRepository)

            const {  newUserName } = req.body
            const wasUserNameChanged = await usersService.changeUserName((req as MyRequest).userId, newUserName)

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
            const usersRepository = new UsersRepository(connection)
            const usersService = new UsersService(usersRepository)

            const { newUserFullName } = req.body
            const wasUserFullNameChanged = await usersService.changeUserFullName((req as MyRequest).userId, newUserFullName)

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

router.patch("/birth-date", validation(changeDateOfBirthSchema), auth(), async (req, res) => {
    try {
        await runInTransaction(async (connetion) => {
            const usersRepository = new UsersRepository(connetion)
            const usersService = new UsersService(usersRepository)

            const { newDate } = req.body
            const wasBirthDateChanged = await usersService.changeDateOfBirth((req as MyRequest).userId, newDate)
            if (!wasBirthDateChanged) {
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

router.patch("/avatar", auth(), upload.single('avatar'), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const usersRepository = new UsersRepository(connection)
            const usersService = new UsersService(usersRepository)
            
            const avatar = req.file?.filename 
            const wasAvatarAdded = await usersService.addAvatar((req as MyRequest).userId, avatar)
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

router.patch("/delete-avatar", auth(), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const usersRepository = new UsersRepository(connection)
            const usersService = new UsersService(usersRepository)

            const wasAvatarDeleted = await usersService.deleteAvatar((req as MyRequest).userId)
            if (!wasAvatarDeleted) {
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

router.patch("/bio", validation(addUserBioSchema), auth(), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const usersRepository = new UsersRepository(connection)
            const usersService = new UsersService(usersRepository)

            const { bio } = req.body
            const wasBioAdded = await usersService.addUserBio((req as MyRequest).userId, bio)
            if(!wasBioAdded) {
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

router.patch("/delete-bio", auth(), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const usersRepository = new UsersRepository(connection)
            const usersService = new UsersService(usersRepository)

            const wasBioDeleted = await usersService.deleteUserBio((req as MyRequest).userId)
            if (!wasBioDeleted) {
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

router.patch("/follow", validation(followUserSchema), auth(), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const usersRepository = new UsersRepository(connection)
            const usersService = new UsersService(usersRepository)

            const { followedId } = req.body
            const wasFollowingOkay = await usersService.followUser((req as MyRequest).userId, followedId)
            if (!wasFollowingOkay) {
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

router.patch("/unfollow", validation(unfollowUserSchema), auth(), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const usersRepository = new UsersRepository(connection)
            const usersService = new UsersService(usersRepository)

            const { followedId } = req.body
            const wasUnfollowingOkay = await usersService.unfollowUser((req as MyRequest).userId, followedId)
            if (!wasUnfollowingOkay) {
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

router.get("/all", async (req, res) => {
    try {
        const users = await runInTransaction(async (connection) => {
            const usersRepository = new UsersRepository(connection)
            const usersService = new UsersService(usersRepository)

            const users = await usersService.getAllUsersInfo()
            return users
        })
        res.json({ users })
    } catch (error) {
        console.log(error) 
        res.json({ success: false })
    }
})

router.get("/followers", async (req, res) => {
    try {
        const followers = await runInTransaction(async (connection) => {
            const usersRepository = new UsersRepository(connection)
            const usersService = new UsersService(usersRepository)

            const followers = await usersService.getAllUserFollowers((req as MyRequest).userId)
            return followers
        })
        res.json({ followers })
    } catch (error) {
        console.log(error)
        res.json({ success: false })
    }
})

router.get("/followings", async (req, res) => {
    try {
        const followings = await runInTransaction(async (connection) => {
            const usersRepository = new UsersRepository(connection)
            const usersService = new UsersService(usersRepository)

            const followings = await usersService.getAllUserFollowings((req as MyRequest).userId)
            return followings
        })
        res.json({ followings })
    } catch (error) {
        console.log(error)
        res.json({ success: false })
    }
})
