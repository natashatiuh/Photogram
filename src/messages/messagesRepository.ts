import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { v4 } from "uuid";
import {
  IGetAllMessageQueryResults,
  IGetChatIdQueryResults,
  IGetChatParticipantsQueryResults,
  IGetOneToOneChatUsersQueryResults,
} from "./interfaces";
import { AllMessagesEntity } from "./entities/allMessagesEntity";

export class MessagesRepository {
  constructor(private connection: PoolConnection) {}

  async addTextMessage(chatId: string, senderId: string, textContent: string) {
    const messageId = v4();
    const type = "text";
    const todayDate = new Date();
    const query = `
        INSERT INTO messages (id, chatId, senderId, type, textContent, sentAt, \`read\`, likes) 
        VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      messageId,
      chatId,
      senderId,
      type,
      textContent,
      todayDate,
      0,
      0,
    ];

    const isChatExist = await this.checkIfChatExists(chatId);
    if (!isChatExist)
      throw new Error("Chat doesn't exist! Create a chat first!");

    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async checkIfChatExists(chatId: string) {
    const query = `
      SELECT id
      FROM chats
      WHERE id = ?
    `;
    const params = [chatId];
    const [rows] = await this.connection.execute<IGetChatIdQueryResults[]>(
      query,
      params
    );
    if (rows.length === 0) return false;
    return true;
  }

  async getAllChatMessages(chatId: string, userId: string) {
    const query = `
      SELECT id, chatId, senderId, type, textContent, mediaUrl, sharedPostId, sentAt, \`read\`, likes
      FROM messages
      WHERE chatId = ? 
    `;
    const params = [chatId];
    const isGroupChatParticipant =
      await this.checkIfUserIsAGroupChatParticipant(chatId, userId);
    const isOneToOneChatParticipant =
      await this.checkIfUserIsOneToOneChatParticipant(chatId, userId);

    if (!isGroupChatParticipant && !isOneToOneChatParticipant)
      throw new Error("User is NOT the chat's participant!");
    const [rows] = await this.connection.execute<IGetAllMessageQueryResults[]>(
      query,
      params
    );
    if (rows.length === 0)
      throw new Error("There are no messages in the chat!");

    const messages = rows.map(
      (message) =>
        new AllMessagesEntity(
          message.id,
          message.chatId,
          message.senderId,
          message.type,
          message.sentAt,
          message.read,
          message.likes,
          message.textContent,
          message.mediaUrl,
          message.sharedPostId
        )
    );

    return messages;
  }

  async checkIfUserIsAGroupChatParticipant(chatId: string, userId: string) {
    const query = `
      SELECT participantId
      FROM group_chats_participants
      WHERE participantId = ? AND chatId = ?
    `;
    const params = [userId, chatId];
    const [rows] = await this.connection.execute<
      IGetChatParticipantsQueryResults[]
    >(query, params);
    if (rows.length === 0) return false;
    return true;
  }

  async checkIfUserIsOneToOneChatParticipant(chatId: string, userId: string) {
    const query = `
      SELECT user1, user2
      FROM chats
      WHERE id = ? AND type = 'one-to-one' AND (user1 = ? OR user2 = ?)
    `;
    const params = [chatId, userId, userId];
    const [rows] = await this.connection.execute<
      IGetOneToOneChatUsersQueryResults[]
    >(query, params);
    if (rows.length === 0) return false;
    return true;
  }

  async unsendMessage(messageId: string, userId: string) {
    const query = `
      DELETE FROM messages
      WHERE id = ? AND senderId = ?
    `;
    const params = [messageId, userId];
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }
}
