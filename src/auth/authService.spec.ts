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

