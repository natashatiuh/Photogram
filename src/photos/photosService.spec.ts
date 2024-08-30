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
})