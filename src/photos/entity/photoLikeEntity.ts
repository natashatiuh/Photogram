export class PhotoLikeEntity {
    id: string
    contentId: string
    likedBy: string

    constructor(id: string, contentId: string, likedBy: string) {
        this.id = id,
        this.contentId = contentId
        this.likedBy = likedBy
    }
}