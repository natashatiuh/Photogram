export class AllMessagesEntity {
  id: string;
  chatId: string;
  senderId: string;
  type: string;
  sendAt: Date;
  textContent?: string;
  mediaUrl?: string;
  sharedPostId?: string;

  constructor(
    id: string,
    chatId: string,
    senderId: string,
    type: string,
    sendAt: Date,
    textContent?: string,
    mediaUrl?: string,
    sharedPostId?: string
  ) {
    this.id = id;
    this.chatId = chatId;
    this.senderId = senderId;
    this.type = type;
    this.sendAt = sendAt;
    this.textContent = textContent;
    this.mediaUrl = mediaUrl;
    this.sharedPostId = sharedPostId;
  }
}
