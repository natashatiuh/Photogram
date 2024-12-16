import dotenv from "dotenv";
dotenv.config();
import { PoolConnection } from "mysql2/promise";
import { pool } from "../common/connection";
import { AuthRepository } from "../auth/authRepository";
import { AuthService } from "../auth/authService";
import { ChatsRepository } from "../chats/chatsRepository";
import { ChatsService } from "../chats/chatsService";
import { MessagesRepository } from "./messagesRepository";
import { MessagesService } from "./messagesService";
import { SignUpUserInput } from "../auth/inputs/signUpUserInput";

jest.setTimeout(6 * 1000);

describe("Messages Service", () => {
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

  async function createMessageService() {
    const messagesRepository = new MessagesRepository(connection);
    const messagesService = new MessagesService(messagesRepository);
    return messagesService;
  }

  test("text message should be added (one-to-one chat)", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();
    const messagesService = await createMessageService();

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
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);

    await chatsService.createOneToOneChat(userId1, userId2);
    const [chat] = await chatsService.getAllChats(userId1);
    if (chat === undefined) throw new Error("Chat shouldn't be undefined!");

    await messagesService.sendTextMessage(
      chat.id,
      userId1,
      "User2, I send it to you!"
    );

    const messages = await messagesService.getAllChatMessages(chat.id, userId2);

    expect(messages.length).toEqual(1);
    expect(messages[0]?.textContent).toEqual("User2, I send it to you!");
  });

  test("text message should be added (group chat)", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();
    const messagesService = await createMessageService();

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
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);

    await chatsService.createGroupChat("Group Chat", userId1);
    const [chat] = await chatsService.getAllChats(userId1);
    if (chat === undefined) throw new Error("The user hasn't got any chats!");
    await chatsService.addParticipantToChat(chat.id, userId2, userId1);

    await messagesService.sendTextMessage(
      chat.id,
      userId1,
      "User1, this message for you!"
    );

    const messages = await messagesService.getAllChatMessages(chat.id, userId1);

    expect(messages.length).toEqual(1);
  });

  test("message should be unsended", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();
    const messagesService = await createMessageService();

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
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);

    await chatsService.createOneToOneChat(userId1, userId2);
    const [chat] = await chatsService.getAllChats(userId1);
    if (chat === undefined) throw new Error("Chat shouldn't be undefined!");

    await messagesService.sendTextMessage(
      chat.id,
      userId1,
      "User2, I send it to you!"
    );
    await messagesService.sendTextMessage(chat.id, userId1, "I send one more");

    const messages = await messagesService.getAllChatMessages(chat.id, userId2);
    if (messages[0] === undefined)
      throw new Error("Messages shouldn't be undefined!");
    await messagesService.unsendMessage(messages[0]?.id, userId1);

    const updatedMessages = await messagesService.getAllChatMessages(
      chat.id,
      userId1
    );

    expect(messages.length).toEqual(2);
    expect(updatedMessages.length).toEqual(1);
  });

  test("message should be edited", async () => {
    const authService = await createAuthService()
    const chatsService = await createChatsService()
    const messagesService = await createMessageService()

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
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);

    await chatsService.createOneToOneChat(userId1, userId2);
    const [chat] = await chatsService.getAllChats(userId1);
    if (chat === undefined) throw new Error("Chat shouldn't be undefined!");

    await messagesService.sendTextMessage(
      chat.id,
      userId1,
      "User2, I send it to you!"
    );
    await messagesService.sendTextMessage(chat.id, userId1, "I send one more");

    const messages = await messagesService.getAllChatMessages(chat.id, userId2);
    if (messages[0] === undefined)
      throw new Error("Messages shouldn't be undefined!");
    await messagesService.editTextMessage(messages[0].id, "This is an edited message!", userId1)

    const editedMessages = await messagesService.getAllChatMessages(chat.id, userId1)
    if (editedMessages[0] === undefined) throw new Error("Message shouldn't be undefined!")
     
    expect(messages[0].textContent).toEqual("User2, I send it to you!")
    expect(editedMessages[0].textContent).toEqual("This is an edited message!")
  })
});
