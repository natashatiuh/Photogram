import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { UserPhotoEntity } from "./entity/userPhotoEntity";
import { v4 } from "uuid";
import { SavedContentEntity } from "./entity/savedContentEntity";
import { PhotoLikeEntity } from "./entity/photoLikeEntity";
import { IGetLikesQueryResult, IGetMarkedUsersQueryResult, IGetPhotoQueryResult, IGetSavedContentQueryResult, IGetSavingsQueryResult } from "./interfaces";
import { MarkedUsersEntity } from "./entity/markedUsersEntity";

export class PhotosRepository {
    constructor(private connection: PoolConnection) {}

    async addPhoto(userId: string, description: string, photo?: string) {
        const startDate = new Date()
        const query = `
            INSERT INTO photos 
            (id, userId, description, likes, markedUsers, archived, sharings, savings, dateOfPublishing)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        const params = [
            photo, userId, description, 0, false, false, 0, 0, startDate
        ]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async updateUserInfo(userId: string) {
        const query = `
            UPDATE users 
            SET posts = posts + 1
            WHERE id = ?
        `
        const params = [userId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    //only user by itself can use this function, because this function shows all photos, even archieved
    async getAllUserPhotos(userId: string) {
        const query = `
            SELECT id, userId, description, likes, markedUsers, archived, sharings, savings, dateOfPublishing
            FROM photos 
            WHERE userId = ?
        `
        const params = [userId]
        const [rows] = await this.connection.execute<IGetPhotoQueryResult[]>(query, params)
        if (rows.length === 0) {
            throw new Error("User has NO photos!")
        }

        const photos = rows.map(photo => 
            new UserPhotoEntity(
                photo.id,
                photo.userId,
                photo.description,
                photo.likes,
                photo.markedUsers,
                photo.archived,
                photo.sharings,
                photo.savings,
                photo.dateOfPublishing
            )
        )

        return photos
    }

    async changePhotoDescription(photoId: string, newDescription: string, userId: string) {
        const query = `
            UPDATE photos
            SET description = ?
            WHERE id = ? AND userId = ?
        `
        const params = [newDescription, photoId, userId]
        const [rows] = await this.connection.execute(query, params) 
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async archivePhoto(photoId: string, userId: string) {
        const query = `
            UPDATE photos
            SET archived = true
            WHERE id = ? AND userId = ?
        `
        const params = [photoId, userId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true 
    }

    async savePhoto(photoId: string, saverId: string) {
        const query = `
            UPDATE photos
            SET savings = savings + 1
            WHERE id = ?
        `
        const params = [photoId]

        const wasContentSaved = await this.addSavingToTheTable(photoId, saverId)
        if(!wasContentSaved) throw new Error("Saving wasn't added!")

        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async addSavingToTheTable(photoId: string, saverId: string) {
        const id = v4()
        const query = `
            INSERT INTO saved_content (id, contentId, saverId)
            VALUES (?, ?, ?)
        `
        const params = [id, photoId, saverId] 
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async unsavePhoto(photoId: string, saverId: string) {
        const query = `
            UPDATE photos
            SET savings = savings - 1
            WHERE id = ?
        `
        const params = [photoId]

        const wasSavingDeleted = await this.deleteSavingFromTheTable(photoId, saverId)
        if (!wasSavingDeleted) throw new Error("Saving was NOT deleted!")

        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async deleteSavingFromTheTable(photoId: string, saverId: string) {
        const query = `
            DELETE FROM saved_content
            WHERE contentId = ? AND saverId = ?
        `
        const params = [photoId, saverId]
        const [rows] = await this.connection.execute(query ,params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async getAllUserSavedContent(saverId: string) {
        const query = `
            SELECT  id, contentId, saverId
            FROM saved_content
            WHERE saverId = ?
        `
        const params = [saverId]
        const [rows] = await this.connection.execute<IGetSavedContentQueryResult[]>(query, params)
        if (rows.length === 0)  {
           throw new Error("User has NO saved content!") 
        }

       const savedContent = rows.map(content => 
            new SavedContentEntity(
                content.id,
                content.contentId,
                content.saverId
            )
        )
        return savedContent
    }

    async likePhoto(photoId: string, userId: string) {
        const query = `
            UPDATE photos
            SET likes = likes + 1
            WHERE id = ?
        `
        const params = [photoId]

        const wasLikeAdded = await this.addLikeToLikes(photoId, userId)
        if (!wasLikeAdded) throw new Error("Like was NOT added!")

        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async addLikeToLikes(photoId: string, userId: string) {
        const id = v4()
        const todayDate = new Date()

        const query = `
            INSERT INTO likes (id, contentId, likedBy, date) 
            VALUES (?, ?, ?, ?)
        `
        const params = [id, photoId, userId, todayDate]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async unlikePhoto(photoId: string, userId: string) {
        const query = `
            UPDATE photos
            SET likes = likes - 1
            WHERE id = ?
        `
        const params = [photoId]

        const wasLikeDeleted = await this.deleteLikeFromLikes(photoId, userId)
        if (!wasLikeDeleted) throw new Error("Like was NOT deleted!")

        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async deleteLikeFromLikes(photoId: string, userId: string) {
        const query = `
            DELETE FROM likes
            WHERE contentId = ? AND likedBy = ?
        `
        const params = [photoId, userId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async getAllPhotoLikes(photoId: string) {
        const query = `
            SELECT id, contentId, likedBy
            FROM likes
            WHERE contentId = ?
        `
        const params = [photoId]
        const [rows] = await this.connection.execute<IGetLikesQueryResult[]>(query, params)
        if (rows.length === 0) {
            throw new Error("Photo has NO likes!")
        }

        const likes = rows.map(like => 
            new PhotoLikeEntity(
                like.id,
                like.contentId,
                like.likedBy
            )
        )
        return likes
    }

    async markUserOnThePhoto(photoId: string, userId: string, markedUser: string) {
        const query = `
            UPDATE photos 
            SET markedUsers = true
            WHERE id = ? AND userId = ?
        `
        const params = [photoId, userId]

        const wasMarkedUserAdded = await this.addMarkedUser(photoId, markedUser)
        if (!wasMarkedUserAdded) throw new Error("Marked user was NOT added!")

        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async addMarkedUser(photoId: string, markedUser: string) {
        const query = `
            INSERT INTO marked_users (userId, contentId) 
            VALUES (?, ?)
        `
        const params = [markedUser, photoId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async getUsersMarkedInPhoto(photoId: string) {
        const query = `
            SELECT userId FROM marked_users
            WHERE contentId = ?
        `
        const params = [photoId]
        const [rows] = await this.connection.execute<IGetMarkedUsersQueryResult[]>(query, params)
        if (rows.length === 0) {
            throw new Error("The photo has NO marked users!")
        }

        const markedUsers = rows.map(markedUser => 
            new MarkedUsersEntity(
                markedUser.userId
            )
        )
            return markedUsers
    }

    async deleteMarkedUserOnThePhoto(photoId: string, markedUser: string) {
        const query = `
            DELETE FROM marked_users
            WHERE contentId = ? AND userId = ?
        `
        const params = [photoId, markedUser]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async checkIfThereIsMarkedUserOnThePhoto(photoId: string) {
        const query = `
            SELECT * FROM marked_users
            WHERE contentId = ?
        `
        const params = [photoId]
        const [rows] = await this.connection.execute<IGetMarkedUsersQueryResult[]>(query, params)
        return rows
    }

    async setMarkedUsersFalse(photoId: string, userId: string) {
        const query = `
            UPDATE photos
            SET markedUsers = false
            WHERE id = ? AND userId = ?
        `
        const params = [ photoId, userId ]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    async deletePhoto(photoId: string, userId: string) {
        const query = `
            DELETE FROM photos
            WHERE id = ? AND userId = ?
        `
        const params = [photoId, userId]
        const [rows] = await this.connection.execute(query, params)
        const resultSetHeader = rows as ResultSetHeader
        if (resultSetHeader.affectedRows === 0) return false
        return true
    }

    //all photos of all users(unarchived)
    async getAllPhotos() {
        const query = `
            SELECT id, userId, description, likes, markedUsers, archived, sharings, savings, dateOfPublishing
            FROM photos
            WHERE archived = false
        `
        const [rows] = await this.connection.execute<IGetPhotoQueryResult[]>(query)
        if (rows.length === 0) throw new Error("There are NO photos!")

        const photos = rows.map(photo => 
                new UserPhotoEntity(
                    photo.id,
                    photo.userId,
                    photo.description,
                    photo.likes,
                    photo.markedUsers,
                    photo.archived,
                    photo.sharings,
                    photo.savings,
                    photo.dateOfPublishing
            )
        )
        return photos
    }

    async getAllUserArchivedPhotos(userId: string) {
        const query = `
            SELECT id, userId, description, likes, markedUsers, archived, sharings, savings, dateOfPublishing 
            FROM photos
            WHERE userId = ? AND archived = true
        `
        const params = [userId]
        const [rows] = await this.connection.execute<IGetPhotoQueryResult[]>(query, params)
        if (rows.length === 0) throw new Error("There are NO photos!")

        const photos = rows.map(photo =>
            new UserPhotoEntity(
                photo.id,
                photo.userId,
                photo.description,
                photo.likes,
                photo.markedUsers,
                photo.archived,
                photo.sharings,
                photo.savings,
                photo.dateOfPublishing
        )
    )
    return photos
}

async getAllUserUnarchivedPhotos(userId: string) {
    const query = `
        SELECT id, userId, description, likes, markedUsers, archived, sharings, savings, dateOfPublishing 
        FROM photos
        WHERE userId = ? AND archived = false
    `
    const params = [userId]
    const [rows] = await this.connection.execute<IGetPhotoQueryResult[]>(query, params)
    if (rows.length === 0) throw new Error("There are NO photos!")

    const photos = rows.map(photo =>
        new UserPhotoEntity(
            photo.id,
            photo.userId,
            photo.description,
            photo.likes,
            photo.markedUsers,
            photo.archived,
            photo.sharings,
            photo.savings,
            photo.dateOfPublishing
        )
    )
    return photos
}

async getPhotoSavingsAmount(photoId: string, userId: string) {
    const query = `
        SELECT savings
        FROM photos
        WHERE id = ? AND userId = ?
    `
    const params = [photoId, userId]

    const [rows] = await this.connection.execute<IGetSavingsQueryResult[]>(query, params)
    if (rows.length === 0) throw new Error("There are NO photos!")

    const savingsAmount = rows[0]?.savings
    return savingsAmount
}

}

