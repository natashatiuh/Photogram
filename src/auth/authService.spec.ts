import dotenv from "dotenv"
dotenv.config()
import { PoolConnection } from "mysql2/promise"
import { pool } from "../common/connection"
import { AuthRepository } from "./authRepository"
import { AuthService } from "./authService"
import { SignUpUserInput } from "./inputs/signUpUserInput"
import { string } from "joi"

jest.setTimeout(6 * 1000)

describe("Auth Service", () => {
    let connection: PoolConnection

    beforeAll(async () => {
        connection = await pool.getConnection()
    })

    beforeEach(async () => {
        await connection.query("TRUNCATE users")
    })

    async function createAuthService() {
        const authRepository = new AuthRepository(connection)
        const authService = new AuthService(authRepository)
        return authService
    }

    test("new user should be created", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("marta@gmail.com", "12345678", "marta23", "Martochka", 22)

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        const user = await authService.getUser(userId)

        expect(user.email).toEqual("marta@gmail.com")
        expect(user.userName).toEqual("marta23")
        expect(user.fullName).toEqual("Martochka")
        expect(user.age).toEqual(22)
    })

    test("password should be hashed correctly", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("nina@gmail.com", "11223344", "nino14", "Nina Nino", 14)

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        const user = await authService.getUser(userId)
        const passwordMatch = await authService.checkPassword(userData.password, user.password)

        expect(passwordMatch).toEqual(true)
    })

    test("users younger than 13 years can't be registered", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("barbie@gmail.com", "12345678", "barbie.girl25", "Barbie Luna", 12)

        await expect(authService.signUpUser(userData)).rejects.toThrow("User must be at least 13 years old to sign up.")
    })

    test("user should be signed in", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("ariel@gmail.com", "12345678", "mermaid25", "Ariel", 16)

        const signUpTokens = await authService.signUpUser(userData)
        const signUpUserId = await authService.verifyToken(signUpTokens.accessToken)
        const signInTokens = await authService.signInUser("ariel@gmail.com", "12345678")
        const signInUserId = await authService.verifyToken(signInTokens.accessToken)

        expect(signUpUserId).toEqual(signInUserId)

    })

    test("user shouldn't be signed in", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("monika@gmail.com", "12121212", "monila1999", "Monila Beluchi", 25)
        await authService.signUpUser(userData)

        expect(authService.signInUser("monika@gmail.com", "121212122")).rejects.toThrow("Incorrect credentials!")
    })

    test("userName should be changed", async () => {
        const authService = await createAuthService()
        const userData = await new SignUpUserInput("andrew#gmail.com", "12121212", "andrew12", "Andrew Tern", 24)

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)

        const user = await authService.getUser(userId)
        await authService.changeUserName(userId, "andrew_tern")
        const changedUser = await authService.getUser(userId)

        expect(user.userName).toEqual("andrew12")
        expect(changedUser.userName).toEqual("andrew_tern")
    })

    test("userFullName should be changed", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("cinderella@gmail.com", "12121212", "cinderella_ella", "Cinderella", 18)

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)

        const user = await authService.getUser(userId)
        await authService.changeUserFullName(userId, "Princess Cinderella")
        const changedUser = await authService.getUser(userId)

        expect(user.fullName).toEqual("Cinderella")
        expect(changedUser.fullName).toEqual("Princess Cinderella")
    })

    test("email should be changed", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("loona@gmail.com", "12121212", "loona_loona", "Loona", 28)

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        const user = await authService.getUser(userId)
        await authService.changeEmail(userId, "12loona@gmail.com")
        const updatedUser = await authService.getUser(userId)

        expect(user.email).toEqual("loona@gmail.com")
        expect(updatedUser.email).toEqual("12loona@gmail.com")
    })

    test("password should be changed", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("micky@gmail.com", "12121212", "micky123", "MickyMouse", 14)

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await authService.changePassword(userId, "12121212", "11111111")    
        const updatedUser = await authService.getUser(userId)

        const isOldPasswordMatch = await authService.checkPassword("12121212", updatedUser.password)
        const isNewPasswordMatch = await authService.checkPassword("11111111", updatedUser.password)

        expect(isOldPasswordMatch).toBe(false)
        expect(isNewPasswordMatch).toBe(true)
    })

    test("user should be deleted", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("lola@gmail.com", "12121212", "lolita", "Lolita Lola", 16)

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        const user = await authService.getUser(userId)
        await authService.deleteUser(userId)
    
        expect(user.userName).toEqual("lolita")
        expect(authService.getUser(userId)).rejects.toThrow("User doesn't exist!")
    })

    test("avatar should be added", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("daryna@gmail.com", "12345678", "dashunya24", "Daryna", 24)

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        const user = await authService.getUser(userId)

        await authService.addAvatar(userId, "daryna_avatar")
        const updatedUser = await authService.getUser(userId)

        expect(user.avatar).toEqual(null)
        expect(updatedUser.avatar).toEqual("daryna_avatar")
    })

    test("avatar should be changed", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("shrek@gmail.com", "12121212", "Shreck", "Shreck Green", 38)

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await authService.addAvatar(userId, "shreck_photo")
        const user = await authService.getUser(userId)

        await authService.addAvatar(userId, "shreck_and_fiona")
        const updatedUser = await authService.getUser(userId)

        expect(user.avatar).toEqual("shreck_photo")
        expect(updatedUser.avatar).toEqual("shreck_and_fiona")
    })

    test("avatar should be deleted", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("barbara@gmail.com", "12121212", "barbara26", "Barbara", 26)

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await authService.addAvatar(userId, "barbara_avatar")
        const user = await authService.getUser(userId)

        await authService.deleteAvatar(userId)
        const updatedUser = await authService.getUser(userId)
        
        expect(user.avatar).toEqual("barbara_avatar")
        expect(updatedUser.avatar).toEqual(null)
    })

    test("bio should be added", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("dora@gmail.com", "12121212", "doradora", "Dora", 21)

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await authService.addUserBio(userId, "I love to sing songs!")
        const user = await authService.getUser(userId)

        expect(user.bio).toEqual("I love to sing songs!")
    })

    test("bio should be changed", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("margo@gmail.com", "12121212", "margosha", "Margo Sha", 20)

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await authService.addUserBio(userId, "I love to watch movies!")
        const user = await authService.getUser(userId)
        await authService.addUserBio(userId, "I love my cat!")
        const updatedUser = await authService.getUser(userId)

        expect(user.bio).toEqual("I love to watch movies!")
        expect(updatedUser.bio).toEqual("I love my cat!")
    })

    test("bio shoud be deleted", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("milana@gmail.com", "12121212", "milana21", "Milana", 23)

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await authService.addUserBio(userId, "I love Silva!")
        const user = await authService.getUser(userId)
        await authService.deleteUserBio(userId)
        const updatedUser = await authService.getUser(userId)

        expect(user.bio).toEqual("I love Silva!")
        expect(updatedUser.bio).toEqual(null)
    })

    test("user should have a follower and another user should have a following", async () => {
        const authService = await createAuthService()
        const followerData = new SignUpUserInput("kim@gmail.com", "12121212", "kimberly", "Kimberly", 43)
        const followingData = new SignUpUserInput("kylie@gmail.com", "12121212", "kylie", "Kylie", 27)

        const followerTokens = await authService.signUpUser(followerData)
        const followingTokens = await authService.signUpUser(followingData)
        const followerId = await authService.verifyToken(followerTokens.accessToken)
        const followingId = await authService.verifyToken(followingTokens.accessToken)
        await authService.followUser(followerId, followingId)
        const follower = await authService.getUser(followerId)
        const following = await authService.getUser(followingId)
    
        expect(follower.following).toEqual(1)
        expect(following.followers).toEqual(1)
    })

    test("user should be unfollowed", async () => {
        const authService = await createAuthService()
        const followerData = new SignUpUserInput("henry@gmail.com", "12121212", "henry", "Henry", 56)
        const followingData = new SignUpUserInput("taras@gmail.com", "12121212", "taras12", "Taras", 43)

        const followerTokens = await authService.signUpUser(followerData)
        const followingTokens = await authService.signUpUser(followingData)
        const followerId = await authService.verifyToken(followerTokens.accessToken)
        const followingId = await authService.verifyToken(followingTokens.accessToken)
        await authService.followUser(followerId, followingId)
        const follower = await authService.getUser(followerId)
        const following = await authService.getUser(followingId)
        await authService.unfollowUser(followerId, followingId)
        const updatedFollower = await authService.getUser(followerId)
        const updatedFollowing = await authService.getUser(followingId)

        expect(follower.following).toEqual(1)
        expect(updatedFollower.following).toEqual(0)
        expect(following.followers).toEqual(1)
        expect(updatedFollowing.followers).toEqual(0)
    })
    
})

