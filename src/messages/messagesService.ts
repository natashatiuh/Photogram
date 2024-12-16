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

  async unsendMessage(messageId: string, userId: string) {
    const wasMessageUnsended = await this.messagesRepository.unsendMessage(
      messageId,
      userId
    );
    return wasMessageUnsended;
  }

  async editTextMessage(messageId: string, newMessage: string, userId: string) {
    const wasTextMessageEdited = await this.messagesRepository.editTextMessage(messageId, newMessage, userId)
    return wasTextMessageEdited
  }
}
