import { ChatsRepository } from "./chatsRepository";

export class ChatsService {
  constructor(public chatsRepository: ChatsRepository) {}

  async createOneToOneChat(
    senderId: string,
    recipientId: string,
    firstMessage: string
  ) {
    const wasChatCreated = await this.chatsRepository.createOneToOneChat(
      senderId,
      recipientId,
      firstMessage
    );
    return wasChatCreated;
  }

  async getUserOneToOneChats(userId: string) {
    const userChats = await this.chatsRepository.getUserOneToOneChats(userId);
    return userChats;
  }
}
