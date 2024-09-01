import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { UserPhotoEntity } from "./entity/userPhotoEntity";
import { v4 } from "uuid";
import { SavedContentEntity } from "./entity/savedContentEntity";
import { PhotoLikeEntity } from "./entity/photoLikeEntity";

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

    async getAllUserPhotos(userId: string) {
        const query = `
            SELECT id, userId, description, likes, markedUsers, archived, sharings, savings
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
                photo.savings
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
}

interface IGetPhotoQueryResult extends RowDataPacket {
    id: string,
    userId: string,
    description: string,
    likes: number,
    markedUsers: boolean,
    archived: boolean,
    sharings: number,
    savings: number
}

interface IGetSavedContentQueryResult extends RowDataPacket {
    id: string,
    contentId: string,
    saverId: string
}

interface IGetLikesQueryResult extends RowDataPacket {
    id: string,
    contentId: string,
    likedBy: string,
}