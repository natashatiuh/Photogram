import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { v4 } from "uuid";
import {
  IGetChatParticipants,
  IGetOneToOneUserChatsQueryResults,
  IGetUserGroupChatsQueryResults,
} from "./interfaces";
import { OneToOneChatEntity } from "./entities/oneToOneChatEntity";
import { GroupChatEntity } from "./entities/groupChatEntity";

export class ChatsRepository {
  constructor(private connection: PoolConnection) {}

  async createOneToOneChat(
    senderId: string,
    recipientId: string,
    firstMessage: string
  ) {
    const todayDate = new Date();
    const chatId = v4();
    const query = `
        INSERT INTO chats (id, type, user1, user2, createdAt) 
        VALUES (?, ?, ?, ?, ?)
    `;
    const params = [chatId, "one-to-one", senderId, recipientId, todayDate];

    const addingFirstMessage = await this.addFirstMessage(
      chatId,
      senderId,
      firstMessage,
      todayDate
    );

    if (!addingFirstMessage) throw new Error("First message wasn't added!");

    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async addFirstMessage(
    chatId: string,
    senderId: string,
    textContent: string,
    sendAt: Date
  ) {
    const messageId = v4();
    const query = `
        INSERT INTO messages (id, chatId, senderId, type, textContent, sendAt)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [messageId, chatId, senderId, "text", textContent, sendAt];

    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
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
        new OneToOneChatEntity(chat.id, chat.user1, chat.user2, chat.createdAt)
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
    const query = `
        SELECT id, name, creatorId, createdAt
        FROM chats 
        WHERE creatorId = ?
    `;
    //i need to check chatparticipants table
    const params = [userId];
    const [rows] = await this.connection.execute<
      IGetUserGroupChatsQueryResults[]
    >(query, params);

    if (rows.length === 0) throw new Error("There are no group chats!");

    const userChats = rows.map(
      (chat) =>
        new GroupChatEntity(chat.id, chat.name, chat.creatorId, chat.createdAt)
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
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async getChatParticipants(chatId: string) {
    const query = `
        SELECT participantId
        FROM group_chats_participants
        WHERE chatId = ?
    `;
    const params = [chatId];
    const [rows] = await this.connection.execute<IGetChatParticipants[]>(
      query,
      params
    );
    if (rows.length === 0)
      throw new Error("There are NO perticipants in chat!");

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
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }
}
