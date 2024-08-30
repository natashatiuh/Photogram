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
