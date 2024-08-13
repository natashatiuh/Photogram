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

        if(!user.password) {
            throw new Error("Password should be defined!")
        }

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

        const signUpTokens = await authService.signUpUser(userData)

        expect(authService.signInUser("monika@gmail.com", "121212122")).rejects.toThrow("Incorrect credentials!")
    })
})
