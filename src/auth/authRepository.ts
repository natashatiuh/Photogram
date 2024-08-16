import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { SignUpUserInput } from "./inputs/signUpUserInput";
import { v4 } from "uuid"
import jwt, { JwtPayload, Secret } from "jsonwebtoken"
import bcrypt, { hash } from "bcrypt"
import { UserEntity } from "./entity/userEntity";

export class AuthRepository {
    constructor(private connection: PoolConnection) {}

    async signUpUser(input: SignUpUserInput) {
        if (input.age < 13) {
            throw new Error("User must be at least 13 years old to sign up.")
        }

        const startDate = new Date()
        const userId = v4()
        const hashedPassword = await this.hashPassword(input.password)
        
        const query = `
            INSERT INTO users (id, email, password, userName, fullName, age, followers, following, dateOfRegistration) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        const params = [userId, input.email, hashedPassword, input.userName, input.fullName, input.age, 0, 0, startDate]
        await this.connection.execute(query, params)
        return userId
    }

    async signInUser(email: string, password: string) {
        const query = `
            SELECT id, password FROM users
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
        return user.id
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

    async verifyToken(accessToken: string) {
        const secretKey = process.env.SECRET_KEY as Secret
        const tokenInfo = jwt.verify(accessToken, secretKey) as JwtPayload
        return tokenInfo.userId
    }

    async hashPassword(plainPassword: string) {
        const saltRounds = 10
        const hash = bcrypt.hash(plainPassword, saltRounds)
        return hash
    }

    async checkPassword(plainPassword: string, hashedPassword: string) {
        const match = await bcrypt.compare(plainPassword, hashedPassword)
        return match
    }

    async getUser(userId: string) {
        const query = `
            SELECT id, email, password, userName, fullName, age, avatar, bio, followers, following 
            FROM users
            WHERE id = ?
        `
        const params = [userId]
        const [rows] = await this.connection.execute<IGetUserQueryResult[]>(query, params)
        const userInfo = rows[0]
        if (!userInfo) {
            throw new Error("User doesn't exist!")
        }

        const user = new UserEntity(
            userInfo.id,
            userInfo.email,
            userInfo.password,
            userInfo.userName,
            userInfo.fullName,
            userInfo.age,
            userInfo.avatar,
            userInfo.bio,
            userInfo.followers,
            userInfo.following
        )
        return user
    }

    async changeUserName(userId: string, newUserName: string) {
        const query = `
            UPDATE users 
            SET userName = ?
            WHERE id = ?
        `
        const params = [newUserName, userId]

        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async changeUserFullName(userId: string, newUserFullName: string) {
        const query = `
            UPDATE users
            SET fullName = ?
            WHERE id = ?
        `
        const params = [newUserFullName, userId]

        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async changeEmail(userId: string, newEmail: string) {
        const query = `
            UPDATE users
            SET email = ?
            WHERE id = ? 
        `
        const params = [newEmail, userId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const query = `
            SELECT password FROM users 
            WHERE id = ?
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
            UPDATE users
            SET password = ?
            WHERE id = ? AND password = ?
        `
        const updateParams = [newHashedPassword, userId, currentHashedPassword]
        const [updateRows] = await this.connection.execute(updateQuery,updateParams)
        const resultSetHeader = updateRows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async deleteUser(userId: string) {
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

    async addAvatar(userId: string, avatar?: string) {
        const query = `
            UPDATE users
            SET avatar = ?
            WHERE id = ?
        `
        const params = [avatar, userId]

        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if(resultSetHeader.affectedRows === 0) return false
        return true
    }

    async deleteAvatar(userId: string) {
        const query = `
            UPDATE users
            SET avatar = NULL
            WHERE id = ?
        `
        const params = [userId]

        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if(resultSetHeader.affectedRows === 0) return false
        return true
    }

    async addUserBio(userId: string, bio: string) {
        const query = `
            UPDATE users
            SET bio = ?
            WHERE id = ?
        `
        const params = [bio, userId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if(resultSetHeader.affectedRows === 0) return false
        return true
    }

    async deleteUserBio(userId: string) {
        const query = `
            UPDATE users
            SET bio = NULL
            WHERE id = ?
        `
        const params = [userId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    //if user want to follow another user he use this function
    async followUser(followerId: string, followedId: string) {
        const checkFollowing = await this.checkFollowing(followerId, followedId)
        if (checkFollowing === "follow exists") {
            throw new Error ("The user is already followed!")
        }
        const addNewFollowing = await this.addFollowing(followerId) //the user got +1 following
        const addNewFollower = await this.addFollower(followedId) //the userToFollow got +1 follower
        if (addNewFollowing && addNewFollower === false) return false
        await this.addToFollows(followerId, followedId)
        return true
    }

    async addFollower(userId: string) {
        if (!userId) throw new Error("User is undefined!")

        const query = `
            UPDATE users
            SET followers = followers + 1
            WHERE id = ?
        `
        const params = [userId]

        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async addFollowing(userId: string) {
        if (!userId) throw new Error("User is undefined!")

        const query = `
            UPDATE users
            SET following = following + 1
            WHERE id = ?
        `
        const params = [userId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async checkFollowing(followerId: string, followedId: string) {
        const query = `
            SELECT followerId, followedId
            FROM follows
            WHERE followerId = ? AND followedId = ?
        `
        const params = [followerId, followedId] 
        const [rows] = await this.connection.execute<IGetFollowsQueryResult[]>(query, params)
        let result = "new follow"
        if(rows.length > 0) result = "follow exists"
        return result
    }

    async addToFollows(followerId: string, followedId: string) {
        const currentDate = new Date()

        const query = `
            INSERT INTO follows (followerId, followedId, followDate)
            VALUES (?, ?, ?)
        `
        const params = [followerId, followedId, currentDate]
        await this.connection.execute(query, params)
    }

    async unfollowUser(followerId: string, followedId: string) {
        const checkFollowing = await this.checkFollowing(followerId, followedId)
        if (checkFollowing === "new follow") {
            throw new Error("The user wasn't followed!")
        }

        const deleteFollowing = await this.deleteFollowing(followerId) //the user got -1 following
        const deleteFollower = await this.deleteFollower(followedId) //the userToFollow got -1 follower
        if (deleteFollowing && deleteFollower === false) return false
        await this.deleteFromFollows(followerId, followedId)
        return true

    }

    async deleteFollower(userId: string) {
        const query = `
            UPDATE users
            SET followers = followers - 1
            WHERE id = ?
        `
        const params = [userId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async deleteFollowing(userId: string) {
        const query = `
            UPDATE users
            SET following = following - 1
            WHERE id = ?
        `
        const params = [userId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async deleteFromFollows(followerId: string, followedId: string) {
        const query = `
            DELETE FROM follows
            WHERE followerId = ? AND followedId = ?
        `
        const params = [followerId, followedId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

}

interface IGetUserQueryResult extends RowDataPacket {
    userId: string,
    email: string,
    password: string,
    userName: string,
    fullName: string,
    age: number
}

interface IGetFollowsQueryResult extends RowDataPacket {
    followerId: string,
    followedId: string
}

