export class AllMessagesEntity {
  id: string;
  chatId: string;
  senderId: string;
  type: string;
  sentAt: Date;
  read: boolean;
  likes: number;
  textContent?: string;
  mediaUrl?: string;
  sharedPostId?: string;

  constructor(
    id: string,
    chatId: string,
    senderId: string,
    type: string,
    sentAt: Date,
    read: boolean,
    likes: number,
    textContent?: string,
    mediaUrl?: string,
    sharedPostId?: string
  ) {
    this.id = id;
    this.chatId = chatId;
    this.senderId = senderId;
    this.type = type;
    this.sentAt = sentAt;
    this.read = read;
    this.likes = likes;
    this.textContent = textContent;
    this.mediaUrl = mediaUrl;
    this.sharedPostId = sharedPostId;
  }
}
