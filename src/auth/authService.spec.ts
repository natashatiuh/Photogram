import dotenv from "dotenv"
dotenv.config()
import { PoolConnection } from "mysql2/promise"
import { pool } from "../common/connection"
import { AuthRepository } from "./authRepository"
import { AuthService } from "./authService"
import { SignUpUserInput } from "./inputs/signUpUserInput"
import { UsersRepository } from "../users/usersRepository"
import { UsersService } from "../users/usersService"

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

    async function createAuthRepository() {
        const authRepository = new AuthRepository(connection)
        return authRepository
    }

    async function createUsersService() {
        const usersRepository = new UsersRepository(connection)
        const usersService = new UsersService(usersRepository)
        return usersService
    }

    test("new user should be created", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()
        const userData = new SignUpUserInput("marta@gmail.com", "12345678", "marta23", "Martochka", new Date("2002-03-03"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        const authCredentials = await authService.getAuthCredentials(userId)
        const userInfo = await usersService.getUserInfo(userId)

        expect(authCredentials.email).toEqual("marta@gmail.com")
        expect(userInfo.userName).toEqual("marta23")
        expect(userInfo.fullName).toEqual("Martochka")
    })

    test("new user can't be created with the email which is already used", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()
        const userData1 = new SignUpUserInput("marta@gmail.com", "12345678", "marta23", "Martochka", new Date("2002-03-03"))
        const userData2 = new SignUpUserInput("marta@gmail.com", "12345678", "marta24", "Martochka24", new Date("2002-03-03"))

        const {userId: userId1} = await authService.signUpUser(userData1)
        const authCredentials = await authService.getAuthCredentials(userId1)

        expect(authCredentials.email).toEqual("marta@gmail.com")
        await expect(authService.signUpUser(userData2)).rejects.toThrow("A user with this email already exists!")
        
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

    test("user's age should be calculated correctly", async () => {
        const authRepository = await createAuthRepository()

        const dateOfBirth1 = new Date("2000-10-25") 
        const dateOfBirth2 = new Date("2004-04-01") 
        const dateOfBirth3 = new Date("2010-12-31") 
        
        const age1 = await authRepository.getUserAge(dateOfBirth1)
        const age2 = await authRepository. getUserAge(dateOfBirth2)
        const age3 = await authRepository.getUserAge(dateOfBirth3)

        expect(age1).toEqual(24)
        expect(age2).toEqual(20)
        expect(age3).toEqual(13)
    })

    test("user should be signed in", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("ariel@gmail.com", "12345678", "mermaid25", "Ariel", new Date("2003-04-12"))

        const signUpTokens = await authService.signUpUser(userData)
        const signUpUserId = await authService.verifyToken(signUpTokens.accessToken)
        const signInTokens = await authService.signInUser("ariel@gmail.com", "12345678")
        const signInUserId = await authService.verifyToken(signInTokens.accessToken)
        
        expect(signUpUserId).toEqual(signInUserId)
    })

    test("user shouldn't be signed in", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("monika@gmail.com", "12121212", "monila1999", "Monila Beluchi", new Date("2000-08-14"))
        await authService.signUpUser(userData)

        expect(authService.signInUser("monika@gmail.com", "121212122")).rejects.toThrow("Incorrect credentials!")
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

    test("password shouldn't be changed", async () => {
        const authService = await createAuthService()
        const userId = "some userId"
        
        await expect(authService.changePassword(userId, "11111111", "1111111")).rejects.toThrow("User not found!")
    })

    test("password shouldn't be changed", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("lola@gmail.com", "12121212", "lolita", "Lolita Lola", new Date("2000-08-14"))
        const { userId: userId } = await authService.signUpUser(userData)

        await expect(authService.changePassword(userId, "11111111", "22222222")).rejects.toThrow("Current password is incorrect!")
    })

    test("password should be a match", async () => {
        const authService = await createAuthService()
        const userData = new SignUpUserInput("lola@gmail.com", "12121212", "lolita", "Lolita Lola", new Date("2000-08-14"))

        const { userId: userId } = await authService.signUpUser(userData)
        const authCredentials = await authService.getAuthCredentials(userId)
        const hashedPassword = authCredentials.password
        const match = await authService.checkPassword("12121212", hashedPassword)

        expect(match).toEqual(true)
    })

    test("user should be deleted", async () => {
        const authService = await createAuthService()
        const usersService = await createUsersService()
        const userData = new SignUpUserInput("lola@gmail.com", "12121212", "lolita", "Lolita Lola", new Date("2000-08-14"))

        const tokens = await authService.signUpUser(userData)
        const userId = await authService.verifyToken(tokens.accessToken)
        const userInfo = await usersService.getUserInfo(userId)
        await authService.deleteUser(userId)
    
        expect(userInfo.userName).toEqual("lolita")
        expect(usersService.getUserInfo(userId)).rejects.toThrow("User doesn't exist!")
    })

})

