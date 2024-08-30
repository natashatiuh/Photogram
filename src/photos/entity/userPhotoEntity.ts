export class UserPhotoEntity {
    id: string
    userId: string
    description: string
    likes: number
    markedUsers: boolean
    archived: boolean
    sharings: number
    savings: number

    constructor(
        id: string, userId: string, description: string, likes: number, markedUsers: boolean, 
        archived: boolean, sharings: number, savings: number) {
            this.id = id,
            this.userId = userId
            this.description = description
            this.likes = likes
            this.markedUsers = markedUsers
            this.archived = archived
            this.sharings = sharings
            this.savings = savings
        }
}