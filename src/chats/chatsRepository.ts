import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { v4 } from "uuid";
import {
  IGetChatDetailsQueryResults,
  IGetChatIdQueryResults,
  IGetChatParticipantsQueryResults,
  IGetOneToOneUserChatsQueryResults,
  IGetUserGroupChatsQueryResults,
} from "./interfaces";
import { OneToOneChatEntity } from "./entities/oneToOneChatEntity";
import { GroupChatEntity } from "./entities/groupChatEntity";
import { ChatEntity } from "./entities/chatEntity";

export class ChatsRepository {
  constructor(private connection: PoolConnection) {}

  async createOneToOneChat(senderId: string, recipientId: string) {
    const todayDate = new Date();
    const chatId = v4();
    const query = `
        INSERT INTO chats (id, type, user1, user2, createdAt) 
        VALUES (?, ?, ?, ?, ?)
    `;

    const isChatExist = await this.checkIfOneToOneChatExists(
      senderId,
      recipientId
    );
    if (isChatExist)
      throw new Error("The chat between users is already exist!");
    const params = [chatId, "one-to-one", senderId, recipientId, todayDate];

    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async checkIfOneToOneChatExists(userId1: string, userId2: string) {
    const query = `
        SELECT id
        FROM chats
        WHERE type = ? AND user1 = ? OR user2 = ? AND user1 = ? OR user2 = ?
    `;
    const params = ["one-to-one", userId1, userId2, userId2, userId1];
    const [rows] = await this.connection.execute<IGetChatIdQueryResults[]>(
      query,
      params
    );
    if (rows.length === 0) return false;
    return true;
  }

  async getUserOneToOneChats(userId: string) {
    const query = `
        SELECT id, user1, user2, createdAt
        FROM chats
        WHERE user1 = ? OR user2 = ? AND type = "one-to-one"
    `;
    const params = [userId, userId];

    const [rows] = await this.connection.execute<
      IGetOneToOneUserChatsQueryResults[]
    >(query, params);

    if (rows.length === 0) throw new Error("User has NO chats!");

    const userChats = rows.map(
      (chat) =>
        new OneToOneChatEntity(
          chat.id,
          chat.type,
          chat.user1,
          chat.user2,
          chat.createdAt
        )
    );

    return userChats;
  }

  async createGroupChat(name: string, creatorId: string) {
    const todayDate = new Date();
    const chatId = v4();
    const query = `
        INSERT INTO chats (id, type, name, creatorId, createdAt)
        VALUES (?, ?, ?, ?, ?)
    `;
    const params = [chatId, "group", name, creatorId, todayDate];
    await this.addParticipantToChat(chatId, creatorId, creatorId);
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async getUserGroupChats(userId: string) {
    const queryParticipants = `
        SELECT chatId 
        FROM group_chats_participants
        WHERE participantId = ?
    `;
    const paramsParticipants = [userId];
    const [rows] = await this.connection.execute<IGetChatIdQueryResults[]>(
      queryParticipants,
      paramsParticipants
    );
    if (rows.length === 0) throw new Error("There are no group chats!");

    const chatIds = rows.map((row) => row.chatId);
    const queryChats = `
        SELECT id, name, cover, creatorId, createdAt
        FROM chats
        WHERE id IN (${chatIds.map(() => "?").join(", ")})
    `;

    const [chatRows] = await this.connection.execute<
      IGetUserGroupChatsQueryResults[]
    >(queryChats, chatIds);

    const userChats = chatRows.map(
      (chat) =>
        new GroupChatEntity(
          chat.id,
          chat.type,
          chat.name,
          chat.cover,
          chat.creatorId,
          chat.createdAt
        )
    );
    return userChats;
  }

  async addParticipantToChat(
    chatId: string,
    participantId: string,
    chatCreatorId: string
  ) {
    const query = `
        INSERT INTO group_chats_participants (participantId, chatId, creatorId)
        VALUES (?, ?, ?)
    `;
    const params = [participantId, chatId, chatCreatorId];
    const isParticipantInTheChat = await this.checkIfParticipantInChat(
      participantId,
      chatId
    );
    if (isParticipantInTheChat)
      throw new Error("This user is already in the chat!");
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async checkIfParticipantInChat(participantId: string, chatId: string) {
    const query = `
        SELECT participantId
        FROM group_chats_participants
        WHERE participantId = ? AND chatId = ?
    `;
    const params = [participantId, chatId];
    const [rows] = await this.connection.execute<
      IGetChatParticipantsQueryResults[]
    >(query, params);
    if (rows.length === 0) return false;
    return true;
  }

  async getChatParticipants(chatId: string) {
    const query = `
        SELECT participantId
        FROM group_chats_participants
        WHERE chatId = ?
    `;
    const params = [chatId];
    const [rows] = await this.connection.execute<
      IGetChatParticipantsQueryResults[]
    >(query, params);
    if (rows.length === 0)
      throw new Error("There are NO participants in chat!");

    return rows;
  }

  async deleteParticipantFromChat(
    chatId: string,
    participantId: string,
    chatCreatorId: string
  ) {
    const query = `
        DELETE FROM group_chats_participants
        WHERE chatId = ? AND participantId = ? AND creatorId = ?
    `;
    const params = [chatId, participantId, chatCreatorId];
    const isParticipantInTheChat = await this.checkIfParticipantInChat(
      participantId,
      chatId
    );
    if (!isParticipantInTheChat)
      throw new Error("This user is NOT in the chat!");
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async leaveGroupChat(chatId: string, userId: string) {
    const query = `
        DELETE FROM group_chats_participants
        WHERE chatId = ? AND participantId = ?
    `;
    const params = [chatId, userId];

    const isUserChatCreator = await this.checkIfUserIsChatCreator(
      chatId,
      userId
    );
    if (isUserChatCreator)
      throw new Error("Chat creator can NOT leave the chat!");

    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows < 0) return false;
    return true;
  }

  async checkIfUserIsChatCreator(chatId: string, userId: string) {
    const query = `
        SELECT id
        FROM chats
        WHERE id = ? AND creatorId = ?
    `;
    const params = [chatId, userId];
    const [rows] = await this.connection.execute<IGetChatIdQueryResults[]>(
      query,
      params
    );
    if (rows.length === 0) return false;
    return true;
  }

  async editGroupChatName(newName: string, chatId: string, creatorId: string) {
    const query = `
        UPDATE chats
        SET name = ?
        WHERE id = ? AND creatorId = ?
    `;
    const params = [newName, chatId, creatorId];
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async changeChatCover(chatId: string, cover: string, userId: string) {
    const query = `
        UPDATE chats
        SET cover = ?
        WHERE id = ? AND creatorId = ?
    `;
    const params = [cover, chatId, userId];
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async deleteChatCover(chatId: string, userId: string) {
    const query = `
        UPDATE chats
        SET cover = NULL
        WHERE id = ? AND creatorId = ?
    `;
    const params = [chatId, userId];
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async getAllChats(userId: string) {
    const oneToOneChatIds = await this.getOneToOneChatIds(userId);
    const groupChatIds = await this.getGroupChatIds(userId);
    const allChatIds = [...oneToOneChatIds, ...groupChatIds];
    if (allChatIds.length === 0) {
      throw new Error("There are no chats!");
    }
    console.log(allChatIds);

    const chatsQuery = `
        SELECT id, type, name, cover, creatorId, user1, user2, createdAt 
        FROM chats
        WHERE id IN (${allChatIds.map(() => "?").join(", ")})
    `;
    const [chats] = await this.connection.execute<
      IGetChatDetailsQueryResults[]
    >(chatsQuery, allChatIds);

    const userChats = chats.map(
      (chat) =>
        new ChatEntity(
          chat.id,
          chat.type,
          chat.createdAt,
          chat.name,
          chat.cover,
          chat.creatorId,
          chat.user1,
          chat.user2
        )
    );
    console.log(userChats);
    return userChats;
  }

  async getOneToOneChatIds(userId: string) {
    const query = `
        SELECT id as chatId
        FROM chats
        WHERE user1 = ? OR user2 = ? AND type = "one-to-one"
    `;
    const params = [userId, userId];
    const [rows] = await this.connection.execute<IGetChatIdQueryResults[]>(
      query,
      params
    );
    const oneToOneChatIds = rows.map((row) => row.chatId);
    return oneToOneChatIds;
  }

  async getGroupChatIds(userId: string) {
    const query = `
        SELECT chatId
        FROM group_chats_participants
        WHERE participantId = ?
    `;
    const params = [userId];
    const [rows] = await this.connection.execute<IGetChatIdQueryResults[]>(
      query,
      params
    );
    const groupChatIds = rows.map((row) => row.chatId);
    return groupChatIds;
  }

  async deleteGroupChatPermanently(chatId: string, creatorId: string) {
    const query = `
        DELETE FROM chats
        WHERE id = ? AND creatorId = ?
    `;
    const params = [chatId, creatorId];
    const [rows] = await this.connection.execute(query, params);
    await this.deleteParticipantsFromDeletedChat(chatId);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async deleteParticipantsFromDeletedChat(chatId: string) {
    const query = `
        DELETE FROM group_chats_participants
        WHERE chatId = ?
    `;
    const params = [chatId];
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }
}
