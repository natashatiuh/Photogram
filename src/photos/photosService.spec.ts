import dotenv from "dotenv"
dotenv.config()
import { PoolConnection } from "mysql2/promise"
import { pool } from "../common/connection"
import { AuthRepository } from "../auth/authRepository"
import { AuthService } from "../auth/authService"
import { UsersRepository } from "../users/usersRepository"
import { UsersService } from "../users/usersService"
import { PhotosRepository } from "./photosRepository"
import { PhotosService } from "./photosService"
import { SignUpUserInput } from "../auth/inputs/signUpUserInput"

jest.setTimeout(6 * 1000)

describe("Photos Service", () => {
    let connection: PoolConnection

    beforeAll(async () => {
        connection = await pool.getConnection()
    })

    beforeEach(async () => {
        await connection.query("TRUNCATE users")
        await connection.query("TRUNCATE auth_credentials")
        await connection.query("TRUNCATE photos")
    })

    async function createAuthService() {
        const authRepository = new AuthRepository(connection)
        const authService = new AuthService(authRepository)
        return authService
    }

    async function createUsersService() {
        const usersRepository = new UsersRepository(connection)
        const userService = new UsersService(usersRepository)
        return userService
    }

    async function createPhotosService() {
        const photosRepository = new PhotosRepository(connection)
        const photosService = new PhotosService(photosRepository)
        return photosService
    }

    test("photos should be added", async () => {
        const authService = await createAuthService()
        const photosService = await createPhotosService()
        const userData = new SignUpUserInput("something@gmail.com", "12121212", "kourtney", "Kourtney", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await photosService.addPhoto(userId, "beautiful photo", "photo here")
        await photosService.addPhoto(userId, "description", "photo2")
        const userPhotos = await photosService.getAllUserPhotos(userId)

        expect(userPhotos.length).toEqual(2)
    })

    test("user's posts should be updated", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()
        const photosService = await createPhotosService()
        const userData = new SignUpUserInput("something@gmail.com", "12121212", "kourtney", "Kourtney", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await photosService.addPhoto(userId, "beautiful photo", "photo here")
        await photosService.addPhoto(userId, "description", "photo2")
        const user = await usersService.getUserInfo(userId)

        expect(user.posts).toEqual(2)
    })

    test("photo description should be changed", async () => {
        const authService = await createAuthService()
        const photosService = await createPhotosService()
        const userData = new SignUpUserInput("monika@gmail.com", "12121212", "monika", "Monika", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await photosService.addPhoto(userId, "something here", "photo1")
        const photo = await photosService.getAllUserPhotos(userId)
        await photosService.changePhotoDescription("photo1", "new description", userId)
        const updatedPhoto = await photosService.getAllUserPhotos(userId)
        
        expect(photo[0]?.description).toEqual("something here")
        expect(updatedPhoto[0]?.description).toEqual("new description")
    })

    test("photo should be archieved", async () => {
        const authService = await createAuthService()
        const photosService = await createPhotosService()
        const userData = new SignUpUserInput("north@gmail.com", "12121212", "north", "North", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await photosService.addPhoto(userId, "description1", "photo1")
        await photosService.addPhoto(userId, "description2", "photo2")
        await photosService.archivePhoto("photo2", userId)
        const photos = await photosService.getAllUserPhotos(userId)

        expect(photos[0]?.archived).toEqual(0)
        expect(photos[1]?.archived).toEqual(1)
    })
})