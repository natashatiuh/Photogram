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

  async createGroupChat(name: string, creatorId: string) {
    const wasChatCreated = await this.chatsRepository.createGroupChat(
      name,
      creatorId
    );
    return wasChatCreated;
  }

  async getUserGroupChats(userId: string) {
    const userChats = await this.chatsRepository.getUserGroupChats(userId);
    return userChats;
  }

  async addParticipantToChat(
    chatId: string,
    participantId: string,
    chatCreatorId: string
  ) {
    const wasParticipantAdded = await this.chatsRepository.addParticipantToChat(
      chatId,
      participantId,
      chatCreatorId
    );
    return wasParticipantAdded;
  }

  async getChatParticipants(chatId: string) {
    const chatParticipants = await this.chatsRepository.getChatParticipants(
      chatId
    );
    return chatParticipants;
  }

  async deleteParticipantFromChat(
    chatId: string,
    participantId: string,
    chatCreatorId: string
  ) {
    const wasParticipantDeleted =
      await this.chatsRepository.deleteParticipantFromChat(
        chatId,
        participantId,
        chatCreatorId
      );
    return wasParticipantDeleted;
  }

  async editGroupChatName(newName: string, chatId: string, creatorId: string) {
    const wasChatNameChanged = await this.chatsRepository.editGroupChatName(
      newName,
      chatId,
      creatorId
    );
    return wasChatNameChanged;
  }

  async changeChatCover(chatId: string, cover: string, userId: string) {
    const wasCoverChanged = await this.chatsRepository.changeChatCover(
      chatId,
      cover,
      userId
    );
    return wasCoverChanged;
  }

  async deleteChatCover(chatId: string, userId: string) {
    const wasCoverDeleted = await this.chatsRepository.deleteChatCover(
      chatId,
      userId
    );
    return wasCoverDeleted;
  }

  async getAllChats(userId: string) {
    const userChats = await this.chatsRepository.getAllChats(userId);
    return userChats;
  }
}
