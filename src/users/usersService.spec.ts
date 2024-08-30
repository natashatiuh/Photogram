import dotenv from "dotenv"
dotenv.config()
import { PoolConnection } from "mysql2/promise"
import { pool } from "../common/connection"
import { AuthRepository } from "../auth/authRepository"
import { AuthService } from "../auth/authService"
import { SignUpUserInput } from "../auth/inputs/signUpUserInput"
import { UsersRepository } from "./usersRepository"
import { UsersService } from "./usersService"

jest.setTimeout(6 * 1000)

describe("Users Service", () => {
    let connection: PoolConnection

    beforeAll(async () => {
        connection = await pool.getConnection()
    })

    beforeEach(async () => {
        await connection.query("TRUNCATE users")
        await connection.query("TRUNCATE auth_credentials")
        await connection.query("TRUNCATE follows")
    })

    async function createAuthService() {
        const authRepository = new AuthRepository(connection)
        const authService = new AuthService(authRepository)
        return authService
    }
    
    async function createUsersService() {
        const usersRepository = new UsersRepository(connection)
        const usersService = new UsersService(usersRepository)
        return usersService
    }

    test("userName should be changed", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()
        const userData = await new SignUpUserInput("andrew@gmail.com", "12121212", "andrew12", "Andrew Tern", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        const userInfo = await usersService.getUserInfo(userId)
        await usersService.changeUserName(userId, "andrew_tern")
        const changedUser = await usersService.getUserInfo(userId)

        expect(userInfo.userName).toEqual("andrew12")
        expect(changedUser.userName).toEqual("andrew_tern")
    })

    test("userFullName should be changed", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()
        const userData = new SignUpUserInput("cinderella@gmail.com", "12121212", "cinderella_ella", "Cinderella", new Date("2005-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        const userInfo = await usersService.getUserInfo(userId)
        await usersService.changeUserFullName(userId, "Princess Cinderella")
        const changedUser = await usersService.getUserInfo(userId)

        expect(userInfo.fullName).toEqual("Cinderella")
        expect(changedUser.fullName).toEqual("Princess Cinderella")
    })

    test("avatar should be added", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()
        const userData = new SignUpUserInput("daryna@gmail.com", "12345678", "dashunya24", "Daryna", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        const userInfo = await usersService.getUserInfo(userId)
        await usersService.addAvatar(userId, "daryna_avatar")
        const updatedUserInfo = await usersService.getUserInfo(userId)

        expect(userInfo.avatar).toEqual(null)
        expect(updatedUserInfo.avatar).toEqual("daryna_avatar")
    })

    test("avatar should be changed", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()
        const userData = new SignUpUserInput("shrek@gmail.com", "12121212", "Shreck", "Shreck Green", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await usersService.addAvatar(userId, "shreck_photo")
        const userInfo = await usersService.getUserInfo(userId)

        await usersService.addAvatar(userId, "shreck_and_fiona")
        const updatedUserInfo = await usersService.getUserInfo(userId)

        expect(userInfo.avatar).toEqual("shreck_photo")
        expect(updatedUserInfo.avatar).toEqual("shreck_and_fiona")
    })

    test("avatar should be deleted", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()
        const userData = new SignUpUserInput("barbara@gmail.com", "12121212", "barbara26", "Barbara", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await usersService.addAvatar(userId, "barbara_avatar")
        const userInfo = await usersService.getUserInfo(userId)

        await usersService.deleteAvatar(userId)
        const updatedUserInfo = await usersService.getUserInfo(userId)
        
        expect(userInfo.avatar).toEqual("barbara_avatar")
        expect(updatedUserInfo.avatar).toEqual(null)
    })

    test("bio should be added", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()
        const userData = new SignUpUserInput("dora@gmail.com", "12121212", "doradora", "Dora", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await usersService.addUserBio(userId, "I love to sing songs!")
        const userInfo = await usersService.getUserInfo(userId)

        expect(userInfo.bio).toEqual("I love to sing songs!")
    })

    test("bio should be changed", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()
        const userData = new SignUpUserInput("margo@gmail.com", "12121212", "margosha", "Margo Sha", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await usersService.addUserBio(userId, "I love to watch movies!")
        const userInfo = await usersService.getUserInfo(userId)
        await usersService.addUserBio(userId, "I love my cat!")
        const updatedUserInfo = await usersService.getUserInfo(userId)

        expect(userInfo.bio).toEqual("I love to watch movies!")
        expect(updatedUserInfo.bio).toEqual("I love my cat!")
    })

    test("bio shoud be deleted", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()
        const userData = new SignUpUserInput("milana@gmail.com", "12121212", "milana21", "Milana", new Date("2006-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        await usersService.addUserBio(userId, "I love Silva!")
        const userInfo = await usersService.getUserInfo(userId)
        await usersService.deleteUserBio(userId)
        const updatedUserInfo = await usersService.getUserInfo(userId)

        expect(userInfo.bio).toEqual("I love Silva!")
        expect(updatedUserInfo.bio).toEqual(null)
    })

    test("user should have a follower and another user should have a following", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()
        const followerData = new SignUpUserInput("kim@gmail.com", "12121212", "kimberly", "Kimberly", new Date("2000-08-14"))
        const followingData = new SignUpUserInput("kylie@gmail.com", "12121212", "kylie", "Kylie", new Date("2001-08-14"))

        const followerTokens = await authService.signUpUser(followerData)
        const followingTokens = await authService.signUpUser(followingData)
        const followerId = await authService.verifyToken(followerTokens.accessToken)
        const followingId = await authService.verifyToken(followingTokens.accessToken)
        await usersService.followUser(followerId, followingId)
        const followerInfo = await usersService.getUserInfo(followerId)
        const followingInfo = await usersService.getUserInfo(followingId)
    
        expect(followerInfo.followings).toEqual(1)
        expect(followingInfo.followers).toEqual(1)
    })

    test("user shouldn't follow the same user twice", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()

        const userData1 = new SignUpUserInput("user1@gmail.com", "12121212", "user1", "User1", new Date("2004-03-03"))
        const userData2 = new SignUpUserInput("user2@gmail.com", "12121212", "user2", "User2", new Date("2004-03-03"))
        const tokens1 = await authService.signUpUser(userData1)
        const tokens2 = await authService.signUpUser(userData2)
        const userId1 = await authService.verifyToken(tokens1.accessToken)
        const userId2 = await authService.verifyToken(tokens2.accessToken)
        
        await usersService.followUser(userId1, userId2)
        
        expect(usersService.followUser(userId1, userId2)).rejects.toThrow("The user is already followed!")
    })

    test("user should be unfollowed", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()
        const followerData = new SignUpUserInput("henry@gmail.com", "12121212", "henry", "Henry", new Date("2003-08-14"))
        const followingData = new SignUpUserInput("taras@gmail.com", "12121212", "taras12", "Taras", new Date("2000-08-14"))

        const followerTokens = await authService.signUpUser(followerData)
        const followingTokens = await authService.signUpUser(followingData)
        const followerId = await authService.verifyToken(followerTokens.accessToken)
        const followingId = await authService.verifyToken(followingTokens.accessToken)
        await usersService.followUser(followerId, followingId)
        const followerInfo = await usersService.getUserInfo(followerId)
        const followingInfo = await usersService.getUserInfo(followingId)
        await usersService.unfollowUser(followerId, followingId)
        const updatedFollower = await usersService.getUserInfo(followerId)
        const updatedFollowing = await usersService.getUserInfo(followingId)

        expect(followerInfo.followings).toEqual(1)
        expect(updatedFollower.followings).toEqual(0)
        expect(followingInfo.followers).toEqual(1)
        expect(updatedFollowing.followers).toEqual(0)
    })

    test("should get all users", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()

        const userData1 = new SignUpUserInput("user1@gmail.com", "12121212", "user1", "User1", new Date("2004-03-03"))
        const userData2 = new SignUpUserInput("user2@gmail.com", "12121212", "user2", "User2", new Date("2004-03-03"))
        const userData3 = new SignUpUserInput("user3@gmail.com", "12121212", "user3", "User3", new Date("2004-03-03"))
        await authService.signUpUser(userData1)
        await authService.signUpUser(userData2)
        await authService.signUpUser(userData3)
        const users = await usersService.getAllUsersInfo()

        expect(users.length).toEqual(3)
    })

    test("should get all user's followers", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()

        const userData1 = new SignUpUserInput("user1@gmail.com", "12121212", "user1", "User1", new Date("2004-03-03"))
        const userData2 = new SignUpUserInput("user2@gmail.com", "12121212", "user2", "User2", new Date("2004-03-03"))
        const userData3 = new SignUpUserInput("user3@gmail.com", "12121212", "user3", "User3", new Date("2004-03-03"))
        const userData4 = new SignUpUserInput("user4@gmail.com", "12121212", "user4", "User4", new Date("2004-03-03"))

        const tokens1 = await authService.signUpUser(userData1)
        const tokens2 = await authService.signUpUser(userData2)
        const tokens3 = await authService.signUpUser(userData3)
        const tokens4 = await authService.signUpUser(userData4)

        const userId1 = await authService.verifyToken(tokens1.accessToken)
        const userId2 = await authService.verifyToken(tokens2.accessToken)
        const userId3 = await authService.verifyToken(tokens3.accessToken)
        const userId4 = await authService.verifyToken(tokens4.accessToken)

        await usersService.followUser(userId1, userId2)
        await usersService.followUser(userId3, userId2)
        await usersService.followUser(userId4, userId2)
        const user2Followers = await usersService.getAllUserFollowers(userId2)

        expect(user2Followers.length).toEqual(3)
    })

    test("should get all user's followings", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()

        const userData1 = new SignUpUserInput("user1@gmail.com", "12121212", "user1", "User1", new Date("2004-03-03"))
        const userData2 = new SignUpUserInput("user2@gmail.com", "12121212", "user2", "User2", new Date("2004-03-03"))
        const userData3 = new SignUpUserInput("user3@gmail.com", "12121212", "user3", "User3", new Date("2004-03-03"))
        const userData4 = new SignUpUserInput("user4@gmail.com", "12121212", "user4", "User4", new Date("2004-03-03"))

        const tokens1 = await authService.signUpUser(userData1)
        const tokens2 = await authService.signUpUser(userData2)
        const tokens3 = await authService.signUpUser(userData3)
        const tokens4 = await authService.signUpUser(userData4)

        const userId1 = await authService.verifyToken(tokens1.accessToken)
        const userId2 = await authService.verifyToken(tokens2.accessToken)
        const userId3 = await authService.verifyToken(tokens3.accessToken)
        const userId4 = await authService.verifyToken(tokens4.accessToken)

        await usersService.followUser(userId1, userId2)
        await usersService.followUser(userId1, userId3)
        await usersService.followUser(userId1, userId4)
        const user1Followings = await usersService.getAllUserFollowings(userId1)

        expect(user1Followings.length).toEqual(3)
    })
    
})
