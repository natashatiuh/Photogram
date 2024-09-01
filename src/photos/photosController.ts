import express from "express"
import { v4 } from "uuid"
import multer from "multer"
import path from "path"
import { validation } from "../common/middlewares/validation"
import { auth } from "../common/middlewares/auth"
import { runInTransaction } from "../common/middlewares/transaction"
import { PhotosRepository } from "./photosRepository"
import { PhotosService } from "./photosService"
import { MyRequest } from "../common/requestDefinition"
import { changePhotoDescription } from "./schemas/changePhotoDescriptionSchema"
import { archivePhotoSchema } from "./schemas/archivePhotoSchema"
import { savePhotoSchema } from "./schemas/savePhotoSchema"
import { unsavePhotoSchema } from "./schemas/unsavePhotoSchema"

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images/photos")
    }, 
    filename: (req, file, cb) => {
        cb(null, v4() + path.extname(file.originalname))
    },
})

const upload = multer({
    storage: storage
})

export const router = express.Router()

router.post("/", auth(), upload.single("photo"), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const photosRepository = new PhotosRepository(connection)
            const photosService = new PhotosService(photosRepository)

            const photo = req.file?.filename
            const { description } = req.body
            const wasPhotoAdded = await photosService.addPhoto((req as MyRequest).userId, description, photo)
            if (!wasPhotoAdded) {
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

router.get("/all-user-photos", auth(), async (req, res) => {
    try {
        const photos = await runInTransaction(async (connection) => {
            const photosRepository = new PhotosRepository(connection)
            const photosService = new PhotosService(photosRepository)

            const photos = await photosService.getAllUserPhotos((req as MyRequest).userId)
            if (!photos) {
                res.json({ success: false })
            } else {
                res.json({ photos })
            }
        })
        return photos
    } catch (error) {
        console.log(error)
        res.json({ success: false })
    }
})

router.patch("/description", validation(changePhotoDescription), auth(), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const photosRepository = new PhotosRepository(connection)
            const photosService = new PhotosService(photosRepository)

            const { photoId, newDescription } = req.body
            const wasDescriptionChanged = await photosService.changePhotoDescription(photoId, newDescription, (req as MyRequest).userId)
            if (!wasDescriptionChanged) {
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

router.patch("/archive", validation(archivePhotoSchema), auth(), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const photosRepository = new PhotosRepository(connection)
            const photosService = new PhotosService(photosRepository)

            const { photoId } = req.body
            const wasPhotoArchived = await photosService.archivePhoto(photoId, (req as MyRequest).userId)
            if (!wasPhotoArchived) {
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

router.post("/save", validation(savePhotoSchema), auth(), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const photosRepository = new PhotosRepository(connection)
            const photosService = new PhotosService(photosRepository)

            const { photoId } = req.body
            const wasPhotoSaved = await photosService.savePhoto(photoId, (req as MyRequest).userId)
            if (!wasPhotoSaved) {
                res.json({ success: false })
            } else {
                res.json({ success: true })
            }
        })
    } catch(error) {
        console.log(error)
        res.json({ success: false })
    }
})

router.delete("/unsave", validation(unsavePhotoSchema), auth(), async (req, res) => {
    try {
        await runInTransaction(async (connection) => {
            const photosRepository = new PhotosRepository(connection)
            const photosService = new PhotosService(photosRepository)

            const { photoId } = req.body
            const wasPhotoUnsaved = await photosService.unsavePhoto(photoId, (req as MyRequest).userId)
            if (!wasPhotoUnsaved) {
                res.json({ success: false })
            } else {
                res.json({ success: true })
            }
        })
    } catch(error) {
        console.log(error)
        res.json({ success: false })
    }
})

router.get("/user-saved-photos", auth(), async (req, res) => {
    try {
        const savedContent = await runInTransaction(async (connection) => {
            const photosRepository = new PhotosRepository(connection)
            const photosService = new PhotosService(photosRepository)

            const savedContent = await photosService.getAllUserSavedContent((req as MyRequest).userId)
            if (!savedContent) {
                res.json({ success: false })
            } else {
                res.json({ savedContent })
            }
        })
        return savedContent
    } catch(error) {
        console.log(error)
        res.json({ success: false })
    }
})
