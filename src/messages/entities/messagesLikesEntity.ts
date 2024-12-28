export class MessagesLikesEntity {
    id: string;
    messageId: string;
    likedBy: string;

    constructor(id: string, messageId: string, likedBy: string) {
        this.id = id,
        this.messageId = messageId
        this.likedBy = likedBy
    }
}