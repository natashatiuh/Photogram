import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { v4 } from "uuid";
import { IGetUserChatsQueryResults } from "./interfaces";
import { OneToOneChatEntity } from "./entities/oneToOneChatEntity";

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

    const [rows] = await this.connection.execute<IGetUserChatsQueryResults[]>(
      query,
      params
    );

    if (rows.length === 0) throw new Error("User has NO chats!");

    const userChats = rows.map(
      (chat) =>
        new OneToOneChatEntity(chat.id, chat.user1, chat.user2, chat.createdAt)
    );

    return userChats;
  }
}
