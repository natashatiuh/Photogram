import dotenv from "dotenv";
dotenv.config();
import { PoolConnection } from "mysql2/promise";
import { pool } from "../common/connection";
import { AuthRepository } from "../auth/authRepository";
import { AuthService } from "../auth/authService";
import { UsersRepository } from "../users/usersRepository";
import { UsersService } from "../users/usersService";
import { PhotosRepository } from "../photos/photosRepository";
import { PhotosService } from "../photos/photosService";
import { ChatsRepository } from "./chatsRepository";
import { ChatsService } from "./chatsService";
import { SignUpUserInput } from "../auth/inputs/signUpUserInput";

jest.setTimeout(6 * 1000);

describe("Photos Service", () => {
  let connection: PoolConnection;

  beforeAll(async () => {
    connection = await pool.getConnection();
  });

  beforeEach(async () => {
    await connection.query("TRUNCATE users");
    await connection.query("TRUNCATE auth_credentials");
    await connection.query("TRUNCATE chats");
    await connection.query("TRUNCATE messages");
    await connection.query("TRUNCATE group_chats_participants");
  });

  async function createAuthService() {
    const authRepository = new AuthRepository(connection);
    const authService = new AuthService(authRepository);
    return authService;
  }

  async function createChatsService() {
    const chatsRepository = new ChatsRepository(connection);
    const chatsService = new ChatsService(chatsRepository);
    return chatsService;
  }

  test("one-to-one chat should be created", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();

    const userData1 = new SignUpUserInput(
      "user1@gmail.com",
      "11111111",
      "user1",
      "User1",
      new Date("2002-03-16")
    );
    const userData2 = new SignUpUserInput(
      "user2@gmail.com",
      "11111111",
      "user2",
      "User2",
      new Date("2002-03-16")
    );
    const tokens1 = await authService.signUpUser(userData1);
    const tokens2 = await authService.signUpUser(userData2);
    const userId1 = await authService.verifyToken(tokens1.accessToken);
    const userId2 = await authService.verifyToken(tokens2.accessToken);
    await chatsService.createOneToOneChat(userId1, userId2, "Hello user2!");
    const user1Chats = await chatsService.getUserOneToOneChats(userId1);
    const user2Chats = await chatsService.getUserOneToOneChats(userId2);

    expect(user1Chats.length).toEqual(1);
    expect(user2Chats.length).toEqual(1);
  });

  test("group chat should be created", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();

    const userData = new SignUpUserInput(
      "user1@gmail.com",
      "11111111",
      "user1",
      "User1",
      new Date("2002-03-16")
    );
    const tokens = await authService.signUpUser(userData);
    const userId = await authService.verifyToken(tokens.accessToken);
    await chatsService.createGroupChat("Classmates group", userId);
    const userChat = await chatsService.getUserGroupChats(userId);

    expect(userChat.length).toEqual(1);
    expect(userChat[0]?.name).toEqual("Classmates group");
  });

  test("participants should be added to the chat", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();

    const userData1 = new SignUpUserInput(
      "user1@gmail.com",
      "11111111",
      "user1",
      "User1",
      new Date("2002-03-16")
    );
    const userData2 = new SignUpUserInput(
      "user2@gmail.com",
      "11111111",
      "user2",
      "User2",
      new Date("2002-03-16")
    );
    const tokens1 = await authService.signUpUser(userData1);
    const tokens2 = await authService.signUpUser(userData2);
    const userId1 = await authService.verifyToken(tokens1.accessToken);
    const userId2 = await authService.verifyToken(tokens2.accessToken);
    await chatsService.createGroupChat("Classmates group", userId1);
    const chat = await chatsService.getUserGroupChats(userId1);
    const chatId = chat[0]?.id;
    if (chatId === undefined) return;
    await chatsService.addParticipantToChat(chatId, userId2, userId1);
    const chatParticipants = await chatsService.getChatParticipants(chatId);

    expect(chatParticipants.length).toEqual(2);
  });

  test("participant should be deleted from the chat", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();

    const userData1 = new SignUpUserInput(
      "user1@gmail.com",
      "11111111",
      "user1",
      "User1",
      new Date("2002-03-16")
    );
    const userData2 = new SignUpUserInput(
      "user2@gmail.com",
      "11111111",
      "user2",
      "User2",
      new Date("2002-03-16")
    );
    const tokens1 = await authService.signUpUser(userData1);
    const tokens2 = await authService.signUpUser(userData2);
    const userId1 = await authService.verifyToken(tokens1.accessToken);
    const userId2 = await authService.verifyToken(tokens2.accessToken);
    await chatsService.createGroupChat("Classmates group", userId1);
    const chat = await chatsService.getUserGroupChats(userId1);
    const chatId = chat[0]?.id;
    if (chatId === undefined) return;
    await chatsService.addParticipantToChat(chatId, userId2, userId1);
    const chatParticipants = await chatsService.getChatParticipants(chatId);
    await chatsService.deleteParticipantFromChat(chatId, userId2, userId1);
    const updatedChatParticipants = await chatsService.getChatParticipants(
      chatId
    );

    expect(chatParticipants.length).toEqual(2);
    expect(updatedChatParticipants.length).toEqual(1);
  });

  //there are should be a test which check if the first message in chat was added to messages table
});
