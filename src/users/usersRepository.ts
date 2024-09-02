import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { v4 } from "uuid"
import jwt, { JwtPayload, Secret } from "jsonwebtoken"
import bcrypt, { hash } from "bcrypt"
import { UserEntity } from "./entities/userEntity";
import { FollowersEntity } from "./entities/followersEntity";
import { FollowingsEntity } from "./entities/followingsEntity";
import { IGetFollowsQueryResult, IGetUserQueryResult } from "./interfaces";

export class UsersRepository {
    constructor(private connection: PoolConnection) {}
    
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

    async changeDateOfBirth(userId: string, newDate: Date) {
        const query = `
            UPDATE users
            SET dateOfBirth = ?
            WHERE id = ?
        `
        const params = [newDate, userId]
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
        const checkFollowing = await this.checkIfFollowingExists(followerId, followedId)
        if (checkFollowing === "follow exists") {
            throw new Error ("The user is already followed!")
        }
        const addNewFollowing = await this.addFollowing(followerId) //the user got +1 following
        const addNewFollower = await this.addFollower(followedId) //the userToFollow got +1 follower
        if (addNewFollowing && addNewFollower === false) return false
        await this.addToFollowsTable(followerId, followedId)
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
            SET followings = followings + 1
            WHERE id = ?
        `
        const params = [userId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async checkIfFollowingExists(followerId: string, followedId: string) {
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

    async addToFollowsTable(followerId: string, followedId: string) {
        const currentDate = new Date()

        const query = `
            INSERT INTO follows (followerId, followedId, followDate)
            VALUES (?, ?, ?)
        `
        const params = [followerId, followedId, currentDate]
        await this.connection.execute(query, params)
    }

    async unfollowUser(followerId: string, followedId: string) {
        const checkFollowing = await this.checkIfFollowingExists(followerId, followedId)
        if (checkFollowing === "new follow") {
            throw new Error("The user wasn't followed!")
        }

        const deleteFollowing = await this.deleteFollowing(followerId) //the user got -1 following
        const deleteFollower = await this.deleteFollower(followedId) //the userToFollow got -1 follower
        if (deleteFollowing && deleteFollower === false) return false
        await this.deleteFromFollowsTable(followerId, followedId)
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
            SET followings = followings - 1
            WHERE id = ?
        `
        const params = [userId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async deleteFromFollowsTable(followerId: string, followedId: string) {
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

    async getUserInfo(userId: string) {
        const query = `
            SELECT id, userName, fullName, dateOfBirth, avatar, bio, followers, followings, posts 
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
            userInfo.userName,
            userInfo.fullName,
            userInfo.dateOfBirth,
            userInfo.avatar,
            userInfo.bio,
            userInfo.followers,
            userInfo.followings,
            userInfo.posts
        )
        return user
    }

    async getAllUsersInfo() {
        const query = `
            SELECT id, userName, fullName, dateOfBirth, avatar, bio, followers, followings, posts 
            FROM users 
        `
        const [rows] = await this.connection.execute<IGetUserQueryResult[]>(query)

        if (rows.length === 0) {
            throw new Error("No users found!")
        }

        const users = rows.map(userInfo => 
            new UserEntity(
                userInfo.id,
                userInfo.userName,
                userInfo.fullName,
                userInfo.dateOfBirth,
                userInfo.avatar,
                userInfo.bio,
                userInfo.followers,
                userInfo.followings,
                userInfo.posts
            )
        )

        return users
    }

    async getAllUserFollowers(followedId: string) {
        const query = `
            SELECT followerId 
            FROM follows
            WHERE followedId = ?
        `
        const params = [followedId]
        const [rows] = await this.connection.execute<IGetFollowsQueryResult[]>(query, params)
        if (rows.length === 0) {
            throw new Error("User has no followers!")
        }

        const followers = rows.map(follower =>
            new FollowersEntity(
                follower.followerId
            )
        )

        return followers
    }

    async getAllUserFollowings(followerId: string) {
        const query = `
            SELECT followedId
            FROM follows
            WHERE followerId = ?
        `
        const params = [followerId]
        const [rows] = await this.connection.execute<IGetFollowsQueryResult[]>(query, params)
        if (rows.length === 0) {
            throw new Error("User has no followings!")
        }

        const followings = rows.map(following => 
            new FollowingsEntity (
                following.followedId
            )
        )

        return followings
    }
}


