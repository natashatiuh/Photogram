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
        await connection.query("TRUNCATE saved_content")
        await connection.query("TRUNCATE likes")
        await connection.query("TRUNCATE marked_users")
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

    test("photo should be saved", async () => {
        const authService = await createAuthService()
        const photosService = await createPhotosService()
        const userData = new SignUpUserInput("jack@gmail.com", "12121212", "jack", "Jack", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await photosService.addPhoto(userId, "description", "photo1")
        await photosService.addPhoto(userId, "description", "photo2")
        await photosService.addPhoto(userId, "description", "photo3")
        await photosService.savePhoto("photo2",userId)
        await photosService.savePhoto("photo3", userId)
        const photos = await photosService.getAllUserPhotos(userId)
        const savedContent = await photosService.getAllUserSavedContent(userId)

        expect(photos[0]?.savings).toEqual(0)
        expect(photos[1]?.savings).toEqual(1)
        expect(photos[2]?.savings).toEqual(1)
        expect(savedContent.length).toEqual(2)
    })

    test("photo should be unsaved", async () => {
        const authService = await createAuthService()
        const photosService = await createPhotosService()
        const userData = new SignUpUserInput("dream@gmail.com", "12121212", "dream", "Dream", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await photosService.addPhoto(userId, "description", "photo1")
        await photosService.addPhoto(userId, "description", "photo2")
        await photosService.addPhoto(userId, "description", "photo3")
        await photosService.savePhoto("photo1", userId)
        await photosService.savePhoto("photo2",userId)
        await photosService.savePhoto("photo3",userId)
        await photosService.unsavePhoto("photo1", userId)
        const photos = await photosService.getAllUserPhotos(userId)
        const savedContent = await photosService.getAllUserSavedContent(userId)

        
        expect(photos[0]?.savings).toEqual(0)
        expect(photos[1]?.savings).toEqual(1)
        expect(savedContent.length).toEqual(2)
    })

    test("like should be added", async () => {
        const authService = await createAuthService()
        const photosService = await createPhotosService()
        const userDataOne = new SignUpUserInput("dream@gmail.com", "12121212", "dream", "Dream", new Date("2000-08-14"))
        const userDataTwo = new SignUpUserInput("jack@gmail.com", "12121212", "jack", "Jack", new Date("2000-08-14"))

        const tokensOne = await authService.signUpUser(userDataOne)
        const tokensTwo = await authService.signUpUser(userDataTwo)
        const userIdOne = await authService.verifyToken(tokensOne.accessToken)
        const userIdTwo = await authService.verifyToken(tokensTwo.accessToken)
        await photosService.addPhoto(userIdOne, "description", "photo1")
        await photosService.likePhoto("photo1", userIdOne)
        await photosService.likePhoto("photo1", userIdTwo)
        const photos = await photosService.getAllUserPhotos(userIdOne)
        const photoLikes = await photosService.getAllPhotoLikes("photo1")

        expect(photos[0]?.likes).toEqual(2)
        expect(photoLikes.length).toEqual(2)
    })

    test("like should be deleted", async () => {
        const authService = await createAuthService()
        const photosService = await createPhotosService()
        const userDataOne = new SignUpUserInput("dream@gmail.com", "12121212", "dream", "Dream", new Date("2000-08-14"))
        const userDataTwo = new SignUpUserInput("jack@gmail.com", "12121212", "jack", "Jack", new Date("2000-08-14"))

        const tokensOne = await authService.signUpUser(userDataOne)
        const tokensTwo = await authService.signUpUser(userDataTwo)
        const userIdOne = await authService.verifyToken(tokensOne.accessToken)
        const userIdTwo = await authService.verifyToken(tokensTwo.accessToken)
        await photosService.addPhoto(userIdOne, "description", "photo1")
        await photosService.likePhoto("photo1", userIdOne)
        await photosService.likePhoto("photo1", userIdTwo)
        await photosService.unlikePhoto("photo1", userIdOne)
        const photos = await photosService.getAllUserPhotos(userIdOne)
        const photoLikes = await photosService.getAllPhotoLikes("photo1")

        expect(photos[0]?.likes).toEqual(1)
        expect(photoLikes.length).toEqual(1)
    })

    test("user should be marked", async () => {
        const authService = await createAuthService()
        const photosService = await createPhotosService()
        const userDataOne = new SignUpUserInput("dream@gmail.com", "12121212", "dream", "Dream", new Date("2000-08-14"))
        const userDataTwo = new SignUpUserInput("jack@gmail.com", "12121212", "jack", "Jack", new Date("2000-08-14"))
        const userDataThree = new SignUpUserInput("kendal@gmail.com", "12121212", "kendal", "Kendal", new Date("2000-08-14"))

        const tokensOne = await authService.signUpUser(userDataOne)
        const tokensTwo = await authService.signUpUser(userDataTwo)
        const tokensThree = await authService.signUpUser(userDataThree)
        const userIdOne = await authService.verifyToken(tokensOne.accessToken)
        const userIdTwo = await authService.verifyToken(tokensTwo.accessToken)
        const userIdThree = await authService.verifyToken(tokensThree.accessToken)

        await photosService.addPhoto(userIdOne, "description", "photo1")
        await photosService.markUserOnThePhoto("photo1", userIdOne, userIdTwo)
        await photosService.markUserOnThePhoto("photo1", userIdOne, userIdThree)
        const photo = await photosService.getAllUserPhotos(userIdOne)
        const markedUsers = await photosService.getUsersMarkedInPhoto("photo1")

        expect(photo[0]?.markedUsers).toEqual(1)
        expect(markedUsers.length).toEqual(2)
    })

    test("marked user should be deleted", async () => {
        const authService = await createAuthService()
        const photosService = await createPhotosService()
        const userDataOne = new SignUpUserInput("dream@gmail.com", "12121212", "dream", "Dream", new Date("2000-08-14"))
        const userDataTwo = new SignUpUserInput("jack@gmail.com", "12121212", "jack", "Jack", new Date("2000-08-14"))
        const userDataThree = new SignUpUserInput("kendal@gmail.com", "12121212", "kendal", "Kendal", new Date("2000-08-14"))

        const tokensOne = await authService.signUpUser(userDataOne)
        const tokensTwo = await authService.signUpUser(userDataTwo)
        const tokensThree = await authService.signUpUser(userDataThree)
        const userIdOne = await authService.verifyToken(tokensOne.accessToken)
        const userIdTwo = await authService.verifyToken(tokensTwo.accessToken)
        const userIdThree = await authService.verifyToken(tokensThree.accessToken)

        await photosService.addPhoto(userIdOne, "description", "photo1")
        await photosService.markUserOnThePhoto("photo1", userIdOne, userIdTwo)
        await photosService.markUserOnThePhoto("photo1", userIdOne, userIdThree)
        await photosService.deleteMarkedUserOnThePhoto("photo1", userIdOne, userIdTwo)
        const photo = await photosService.getAllUserPhotos(userIdOne)
        const markedUsers = await photosService.getUsersMarkedInPhoto("photo1")

        expect(photo[0]?.markedUsers).toEqual(1)
        expect(markedUsers.length).toEqual(1)
    })

    test("marked user should be deleted and table photos should be updated", async () => {
        const authService = await createAuthService()
        const photosService = await createPhotosService()
        const userDataOne = new SignUpUserInput("dream@gmail.com", "12121212", "dream", "Dream", new Date("2000-08-14"))
        const userDataTwo = new SignUpUserInput("jack@gmail.com", "12121212", "jack", "Jack", new Date("2000-08-14"))
        const userDataThree = new SignUpUserInput("kendal@gmail.com", "12121212", "kendal", "Kendal", new Date("2000-08-14"))

        const tokensOne = await authService.signUpUser(userDataOne)
        const tokensTwo = await authService.signUpUser(userDataTwo)
        const tokensThree = await authService.signUpUser(userDataThree)
        const userIdOne = await authService.verifyToken(tokensOne.accessToken)
        const userIdTwo = await authService.verifyToken(tokensTwo.accessToken)
        const userIdThree = await authService.verifyToken(tokensThree.accessToken)

        await photosService.addPhoto(userIdOne, "description", "photo1")
        await photosService.markUserOnThePhoto("photo1", userIdOne, userIdTwo)
        await photosService.markUserOnThePhoto("photo1", userIdOne, userIdThree)
        await photosService.deleteMarkedUserOnThePhoto("photo1", userIdOne, userIdTwo)
        await photosService.deleteMarkedUserOnThePhoto("photo1", userIdOne, userIdThree)
        const photo = await photosService.getAllUserPhotos(userIdOne)

        expect(photo[0]?.markedUsers).toEqual(0)
    })

    test("photo should be deleted", async () => {
        const authService = await createAuthService()
        const photosService = await createPhotosService()
        const userData = new SignUpUserInput("rocky@gmail.com", "12121212", "rocky", "Rocky", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await photosService.addPhoto(userId, "photo here", "photo1")
        await photosService.addPhoto(userId, "another photo", "photo2")
        await photosService.addPhoto(userId, "and another photo", "photo3")
        await photosService.deletePhoto("photo1", userId)
        const photos = await photosService.getAllUserPhotos(userId)

        expect(photos.length).toEqual(2)
    })

    test("all unarchieved photos should be shown", async () => {
        const authService = await createAuthService()
        const photosService = await createPhotosService()
        const userData = new SignUpUserInput("rocky@gmail.com", "12121212", "rocky", "Rocky", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await photosService.addPhoto(userId, "photo here", "photo1")
        await photosService.addPhoto(userId, "another photo", "photo2")
        await photosService.addPhoto(userId, "and another photo", "photo3")
        await photosService.archivePhoto("photo1", userId)
        const photos = await photosService.getAllPhotos()

        expect(photos.length).toEqual(2)
    })

    test("all user's archived photos should be shown", async () => {
        const authService = await createAuthService()
        const photosService = await createPhotosService()
        const userData = new SignUpUserInput("rocky@gmail.com", "12121212", "rocky", "Rocky", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await photosService.addPhoto(userId, "photo here", "photo1")
        await photosService.addPhoto(userId, "another photo", "photo2")
        await photosService.addPhoto(userId, "and another photo", "photo3")
        await photosService.archivePhoto("photo1", userId)
        await photosService.archivePhoto("photo2", userId)
        const archivedPhotos = await photosService.getAllUserArchivedPhotos(userId)
        const photos = await photosService.getAllUserPhotos(userId) 

        expect(archivedPhotos.length).toEqual(2)
        expect(photos.length).toEqual(3)
    })

    test("all user's unarchived photos should be shown", async () => {
        const authService = await createAuthService()
        const photosService = await createPhotosService()
        const userData = new SignUpUserInput("rocky@gmail.com", "12121212", "rocky", "Rocky", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await photosService.addPhoto(userId, "photo here", "photo1")
        await photosService.addPhoto(userId, "another photo", "photo2")
        await photosService.addPhoto(userId, "and another photo", "photo3")
        await photosService.archivePhoto("photo1", userId)
        const photos = await photosService.getAllUserUnarchivedPhotos(userId) 

        expect(photos.length).toEqual(2)
    })

    test("photo savings should be shown", async () => {
        const authService = await createAuthService()
        const photosService = await createPhotosService()
        const userDataOne = new SignUpUserInput("dream@gmail.com", "12121212", "dream", "Dream", new Date("2000-08-14"))
        const userDataTwo = new SignUpUserInput("jack@gmail.com", "12121212", "jack", "Jack", new Date("2000-08-14"))
        const userDataThree = new SignUpUserInput("kendal@gmail.com", "12121212", "kendal", "Kendal", new Date("2000-08-14"))

        const tokensOne = await authService.signUpUser(userDataOne)
        const tokensTwo = await authService.signUpUser(userDataTwo)
        const tokensThree = await authService.signUpUser(userDataThree)
        const userIdOne = await authService.verifyToken(tokensOne.accessToken)
        const userIdTwo = await authService.verifyToken(tokensTwo.accessToken)
        const userIdThree = await authService.verifyToken(tokensThree.accessToken)

        await photosService.addPhoto(userIdOne, "description", "photo1")
        await photosService.savePhoto("photo1", userIdOne)
        await photosService.savePhoto("photo1", userIdTwo)
        await photosService.savePhoto("photo1", userIdThree)
        const savings = await photosService.getPhotoSavingsAmount("photo1", userIdOne)

        expect(savings).toEqual(3)
    })
})