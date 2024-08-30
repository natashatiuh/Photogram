import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { UserPhotoEntity } from "./entity/userPhotoEntity";

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