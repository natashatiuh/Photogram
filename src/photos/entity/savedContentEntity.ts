export class SavedContentEntity {
    id: string
    contentId: string
    saverId: string

    constructor(id: string, contentId: string, saverId: string) {
        this.id = id
        this.contentId = contentId
        this.saverId = saverId
    }
}