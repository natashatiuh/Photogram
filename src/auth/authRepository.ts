import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { SignUpUserInput } from "./inputs/signUpUserInput";
import { v4 } from "uuid"
import jwt, { JwtPayload, Secret } from "jsonwebtoken"
import bcrypt, { hash } from "bcrypt"
import { AuthCredentialsEntity } from "./entity/authCredentialsEntity";

export class AuthRepository {
    constructor(private connection: PoolConnection) {}

    async signUpUser(input: SignUpUserInput) {
        const userId = v4()
        const userAge = await this.getUserAge(input.dateOfBirth)
        if (userAge < 13) throw new Error("User must be at least 13 years old to sign up.")

        const isEmailUnique = await this.checkEmailUniqueness(input.email)
        if (!isEmailUnique) throw new Error("A user with this email already exists!")

        await this.addAuthCredentials(userId, input)
        await this.addUserInfo(userId, input)
        return userId
    }

    async getUserAge(dateOfBirth: Date) {
        const today = new Date()
        let age = today.getFullYear() - dateOfBirth.getFullYear()
        const monthDifference = today.getMonth() - dateOfBirth.getMonth()

        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dateOfBirth.getDate())) {
            age--
        }

        return age
    }

    async addAuthCredentials(userId: string, input: SignUpUserInput) {
        const startDate = new Date()
        const hashedPassword = await this.hashPassword(input.password)
        const query = `
            INSERT INTO auth_credentials (userId, email, password, dateOfRegistration)
            VALUES (?, ?, ?, ?)
        `
        const params = [userId, input.email, hashedPassword, startDate]
        await this.connection.execute(query, params)
    }

    async addUserInfo(userId: string, input: SignUpUserInput) {
        const query = `
            INSERT INTO users (id, userName, fullName, dateOfBirth, followers, followings, posts)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `
        const params = [userId, input.userName, input.fullName, input.dateOfBirth, 0, 0, 0]
        await this.connection.execute(query, params)
    }

    async hashPassword(plainPassword: string) {
        const saltRounds = 10
        const hash = await bcrypt.hash(plainPassword, saltRounds)
        return hash
    }

    async checkEmailUniqueness(email: string) {
        const query = `
            SELECT email FROM auth_credentials
            WHERE email = ?
        `
        const params = [email]
        const [rows] = await this.connection.execute<IGetUserQueryResult[]>(query, params)
        if (rows.length > 0) return false
        return true        
    }

    async generateTokenS(userId: string) {
        const accessTokenExpirationTime = new Date(Date.now() + 30 * 60 * 1000)
        const refreshTokenExpirationTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

        const accessToken = await this.generateToken(userId, accessTokenExpirationTime)
        const refreshToken = await this.generateToken(userId, refreshTokenExpirationTime)

        return {
            accessToken: accessToken,
            refreshToken: refreshToken,
            expireTime: accessTokenExpirationTime,
            userId: userId
        }
    }

    async generateToken(userId: string, expiration: Date) {
        const claims = {
            userId: userId,
            exp: Math.floor(expiration.getTime() / 1000)
        }

        const secretKey = process.env.SECRET_KEY as Secret
        const token = jwt.sign(claims, secretKey, {algorithm: 'HS256'})
        return token
    }

    async verifyToken(accessToken: string) {
        const secretKey = process.env.SECRET_KEY as Secret
        const tokenInfo = jwt.verify(accessToken, secretKey) as JwtPayload
        return tokenInfo.userId
    }

    async signInUser(email: string, password: string) {
        const query = `
            SELECT userId, password FROM auth_credentials
            WHERE email = ?
        `
        const params = [email]
        const [rows] = await this.connection.execute<IGetUserQueryResult[]>(query, params)
        if(rows.length === 0) throw new Error("Incorrect credentials!")

        const user = rows[0]
        const hashedPassword = user?.password
        if (!hashedPassword) {
            throw new Error("Invalid credentials!")
        }

        const isPasswordValid = await this.checkPassword(password, hashedPassword)
        if (!isPasswordValid) throw new Error("Incorrect credentials!")
        return user.userId
    }

    async checkPassword(plainPassword: string, hashedPassword: string) {
        const match = await bcrypt.compare(plainPassword, hashedPassword)
        return match
    }

    async changeEmail(userId: string, newEmail: string) {
        const query = `
            UPDATE auth_credentials
            SET email = ?
            WHERE userId = ? 
        `
        const params = [newEmail, userId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const query = `
            SELECT password FROM auth_credentials 
            WHERE userId = ?
        ` 
        const params = [userId]
        const [rows] = await this.connection.execute<IGetUserQueryResult[]>(query, params)

        if (rows.length === 0) {
            throw new Error("User not found!")
        }

        const currentHashedPassword = rows[0]?.password

        if (!currentHashedPassword) {
            throw new Error("No password found!")
        }

        const match = await this.checkPassword(currentPassword, currentHashedPassword)
        if (!match) {
            throw new Error("Current password is incorrect!")
        }

        const newHashedPassword = await this.hashPassword(newPassword)
        const updateQuery = `
            UPDATE auth_credentials
            SET password = ?
            WHERE userId = ? AND password = ?
        `
        const updateParams = [newHashedPassword, userId, currentHashedPassword]
        const [updateRows] = await this.connection.execute(updateQuery,updateParams)
        const resultSetHeader = updateRows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async deleteUser(userId: string) {
        const deletedAuthCredentials = await this.deleteAuthCredentials(userId)
        const deletedUserInfo = await this.deleteUserInfo(userId)
        if (deletedAuthCredentials && deletedUserInfo === false) return false
        return true
    }

    async deleteAuthCredentials(userId: string) {
        const query = `
            DELETE FROM auth_credentials
            WHERE userId = ?
        `
        const params = [userId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async deleteUserInfo(userId: string) {
        const query = `
            DELETE FROM users
            WHERE id = ?
        `
        const params = [userId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async getAuthCredentials(userId: string) {
        const query = `
            SELECT userId, email, password
            FROM auth_credentials
            WHERE userId = ?
        `
        const params = [userId]
        const [rows] = await this.connection.execute<IGetUserQueryResult[]>(query, params)
        const authCredentialsInfo = rows[0]
        if (!authCredentialsInfo) {
            throw new Error("Auth Credentials don't exist!")
        }

        const authCredentials = new AuthCredentialsEntity(
            authCredentialsInfo.userId,
            authCredentialsInfo.email,
            authCredentialsInfo.password
        )

        return authCredentials
    }

}

interface IGetUserQueryResult extends RowDataPacket {
    userId: string,
    email: string,
    password: string,
    userName: string,
    fullName: string,
    dateOfBirth: Date
}
