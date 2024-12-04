import { MessagesRepository } from "./messagesRepository";

export class MessagesService {
  constructor(public messagesRepository: MessagesRepository) {}

  async sendTextMessage(chatId: string, senderId: string, textContent: string) {
    const wasTextMessageAdded = await this.messagesRepository.addTextMessage(
      chatId,
      senderId,
      textContent
    );
    return wasTextMessageAdded;
  }

  async getAllChatMessages(chatId: string, userId: string) {
    const messages = await this.messagesRepository.getAllChatMessages(
      chatId,
      userId
    );
    return messages;
  }
}
