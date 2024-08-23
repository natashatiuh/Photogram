import dotenv from "dotenv"
dotenv.config()
import { PoolConnection } from "mysql2/promise"
import { pool } from "../common/connection"
import { AuthRepository } from "./authRepository"
import { AuthService } from "./authService"
import { SignUpUserInput } from "./inputs/signUpUserInput"

jest.setTimeout(6 * 1000)

describe("Auth Service", () => {
    let connection: PoolConnection

    beforeAll(async () => {
        connection = await pool.getConnection()
    })

    beforeEach(async () => {
        await connection.query("TRUNCATE users")
        await connection.query("TRUNCATE auth_credentials")
    })

    async function createAuthService() {
        const authRepository = new AuthRepository(connection)
        const authService = new AuthService(authRepository)
        return authService
    }

    test("new user should be created", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("marta@gmail.com", "12345678", "marta23", "Martochka", new Date("2002-03-03"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        const authCredentials = await authService.getAuthCredentials(userId)
        const userInfo = await authService.getUserInfo(userId)

        expect(authCredentials.email).toEqual("marta@gmail.com")
        expect(userInfo.userName).toEqual("marta23")
        expect(userInfo.fullName).toEqual("Martochka")
    })

    test("password should be hashed correctly", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("nina@gmail.com", "11223344", "nino14", "Nina Nino", new Date("2002-03-03"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        const authCredentials = await authService.getAuthCredentials(userId)
        const passwordMatch = await authService.checkPassword(userData.password, authCredentials.password)

        expect(passwordMatch).toEqual(true)
    })

    test("users younger than 13 years can't be registered", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("barbie@gmail.com", "12345678", "barbie.girl25", "Barbie Luna", new Date("2020-09-09"))

        await expect(authService.signUpUser(userData)).rejects.toThrow("User must be at least 13 years old to sign up.")
    })

    test("user should be signed in", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("ariel@gmail.com", "12345678", "mermaid25", "Ariel", new Date("2003-04-12"))

        const signUpTokens = await authService.signUpUser(userData)
        const signUpUserId = await authService.verifyToken(signUpTokens.accessToken)
        const signInTokens = await authService.signInUser("ariel@gmail.com", "12345678")
        const signInUserId = await authService.verifyToken(signInTokens.accessToken)
        console.log(signUpUserId)
        console.log(signInUserId)
        expect(signUpUserId).toEqual(signInUserId)

    })

    test("user shouldn't be signed in", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("monika@gmail.com", "12121212", "monila1999", "Monila Beluchi", new Date("2000-08-14"))
        await authService.signUpUser(userData)

        expect(authService.signInUser("monika@gmail.com", "121212122")).rejects.toThrow("Incorrect credentials!")
    })

    test("userName should be changed", async () => {
        const authService = await createAuthService()
        const userData = await new SignUpUserInput("andrew@gmail.com", "12121212", "andrew12", "Andrew Tern", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)

        const userInfo = await authService.getUserInfo(userId)
        await authService.changeUserName(userId, "andrew_tern")
        const changedUser = await authService.getUserInfo(userId)

        expect(userInfo.userName).toEqual("andrew12")
        expect(changedUser.userName).toEqual("andrew_tern")
    })

    test("userFullName should be changed", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("cinderella@gmail.com", "12121212", "cinderella_ella", "Cinderella", new Date("2005-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)

        const userInfo = await authService.getUserInfo(userId)
        await authService.changeUserFullName(userId, "Princess Cinderella")
        const changedUser = await authService.getUserInfo(userId)

        expect(userInfo.fullName).toEqual("Cinderella")
        expect(changedUser.fullName).toEqual("Princess Cinderella")
    })

    test("email should be changed", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("loona@gmail.com", "12121212", "loona_loona", "Loona", new Date("1996-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        const authCredentials = await authService.getAuthCredentials(userId)
        await authService.changeEmail(userId, "12loona@gmail.com")
        const updatedAuthCredentials = await authService.getAuthCredentials(userId)

        expect(authCredentials.email).toEqual("loona@gmail.com")
        expect(updatedAuthCredentials.email).toEqual("12loona@gmail.com")
    })

    test("password should be changed", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("micky@gmail.com", "12121212", "micky123", "MickyMouse", new Date("2006-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await authService.changePassword(userId, "12121212", "11111111")    
        const updatedAuthCredentials = await authService.getAuthCredentials(userId)

        const isOldPasswordMatch = await authService.checkPassword("12121212", updatedAuthCredentials.password)
        const isNewPasswordMatch = await authService.checkPassword("11111111", updatedAuthCredentials.password)

        expect(isOldPasswordMatch).toBe(false)
        expect(isNewPasswordMatch).toBe(true)
    })

    test("user should be deleted", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("lola@gmail.com", "12121212", "lolita", "Lolita Lola", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        const userInfo = await authService.getUserInfo(userId)
        await authService.deleteUser(userId)
    
        expect(userInfo.userName).toEqual("lolita")
        expect(authService.getUserInfo(userId)).rejects.toThrow("User doesn't exist!")
    })

    test("avatar should be added", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("daryna@gmail.com", "12345678", "dashunya24", "Daryna", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        const userInfo = await authService.getUserInfo(userId)

        await authService.addAvatar(userId, "daryna_avatar")
        const updatedUserInfo = await authService.getUserInfo(userId)

        expect(userInfo.avatar).toEqual(null)
        expect(updatedUserInfo.avatar).toEqual("daryna_avatar")
    })

    test("avatar should be changed", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("shrek@gmail.com", "12121212", "Shreck", "Shreck Green", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await authService.addAvatar(userId, "shreck_photo")
        const userInfo = await authService.getUserInfo(userId)

        await authService.addAvatar(userId, "shreck_and_fiona")
        const updatedUserInfo = await authService.getUserInfo(userId)

        expect(userInfo.avatar).toEqual("shreck_photo")
        expect(updatedUserInfo.avatar).toEqual("shreck_and_fiona")
    })

    test("avatar should be deleted", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("barbara@gmail.com", "12121212", "barbara26", "Barbara", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await authService.addAvatar(userId, "barbara_avatar")
        const userInfo = await authService.getUserInfo(userId)

        await authService.deleteAvatar(userId)
        const updatedUserInfo = await authService.getUserInfo(userId)
        
        expect(userInfo.avatar).toEqual("barbara_avatar")
        expect(updatedUserInfo.avatar).toEqual(null)
    })

    test("bio should be added", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("dora@gmail.com", "12121212", "doradora", "Dora", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await authService.addUserBio(userId, "I love to sing songs!")
        const userInfo = await authService.getUserInfo(userId)

        expect(userInfo.bio).toEqual("I love to sing songs!")
    })

    test("bio should be changed", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("margo@gmail.com", "12121212", "margosha", "Margo Sha", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await authService.addUserBio(userId, "I love to watch movies!")
        const userInfo = await authService.getUserInfo(userId)
        await authService.addUserBio(userId, "I love my cat!")
        const updatedUserInfo = await authService.getUserInfo(userId)

        expect(userInfo.bio).toEqual("I love to watch movies!")
        expect(updatedUserInfo.bio).toEqual("I love my cat!")
    })

    test("bio shoud be deleted", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("milana@gmail.com", "12121212", "milana21", "Milana", new Date("2006-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await authService.addUserBio(userId, "I love Silva!")
        const userInfo = await authService.getUserInfo(userId)
        await authService.deleteUserBio(userId)
        const updatedUserInfo = await authService.getUserInfo(userId)

        expect(userInfo.bio).toEqual("I love Silva!")
        expect(updatedUserInfo.bio).toEqual(null)
    })

    test("user should have a follower and another user should have a following", async () => {
        const authService = await createAuthService()
        const followerData = new SignUpUserInput("kim@gmail.com", "12121212", "kimberly", "Kimberly", new Date("2000-08-14"))
        const followingData = new SignUpUserInput("kylie@gmail.com", "12121212", "kylie", "Kylie", new Date("2001-08-14"))

        const followerTokens = await authService.signUpUser(followerData)
        const followingTokens = await authService.signUpUser(followingData)
        const followerId = await authService.verifyToken(followerTokens.accessToken)
        const followingId = await authService.verifyToken(followingTokens.accessToken)
        await authService.followUser(followerId, followingId)
        const followerInfo = await authService.getUserInfo(followerId)
        const followingInfo = await authService.getUserInfo(followingId)
    
        expect(followerInfo.followings).toEqual(1)
        expect(followingInfo.followers).toEqual(1)
    })

    test("user should be unfollowed", async () => {
        const authService = await createAuthService()
        const followerData = new SignUpUserInput("henry@gmail.com", "12121212", "henry", "Henry", new Date("2003-08-14"))
        const followingData = new SignUpUserInput("taras@gmail.com", "12121212", "taras12", "Taras", new Date("2000-08-14"))

        const followerTokens = await authService.signUpUser(followerData)
        const followingTokens = await authService.signUpUser(followingData)
        const followerId = await authService.verifyToken(followerTokens.accessToken)
        const followingId = await authService.verifyToken(followingTokens.accessToken)
        await authService.followUser(followerId, followingId)
        const followerInfo = await authService.getUserInfo(followerId)
        const followingInfo = await authService.getUserInfo(followingId)
        await authService.unfollowUser(followerId, followingId)
        const updatedFollower = await authService.getUserInfo(followerId)
        const updatedFollowing = await authService.getUserInfo(followingId)

        expect(followerInfo.followings).toEqual(1)
        expect(updatedFollower.followings).toEqual(0)
        expect(followingInfo.followers).toEqual(1)
        expect(updatedFollowing.followers).toEqual(0)
    })
    
})

