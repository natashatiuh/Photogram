import { RowDataPacket } from "mysql2/promise"

export interface IGetPhotoQueryResult extends RowDataPacket {
    id: string,
    userId: string,
    description: string,
    likes: number,
    markedUsers: boolean,
    archived: boolean,
    sharings: number,
    savings: number
}

export interface IGetSavedContentQueryResult extends RowDataPacket {
    id: string,
    contentId: string,
    saverId: string
}

export interface IGetLikesQueryResult extends RowDataPacket {
    id: string,
    contentId: string,
    likedBy: string,
}

export interface IGetMarkedUsersQueryResult extends RowDataPacket {
    userId: string
}