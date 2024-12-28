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
    await connection.query("TRUNCATE messages_likes");
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

  test("text message shouldn't be added", async () => {
    const authService = await createAuthService();
    const messagesService = await createMessageService();

    const userData1 = new SignUpUserInput(
      "user1@gmail.com",
      "11111111",
      "user1",
      "User1",
      new Date("2002-03-16")
    );
    const { userId: userId1 } = await authService.signUpUser(userData1);
    
    await expect(messagesService.sendTextMessage("chatId", userId1, "Message")).rejects.toThrow("Chat doesn't exist! Create a chat first!")
  })

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

  test("user shouldn't gets messages, he is not in the chat", async () => {
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

    await chatsService.createGroupChat("Chat1", userId1)
    await chatsService.createGroupChat("Chat2", userId2)
    const [chat1] = await chatsService.getAllChats(userId1)
    const [chat2] = await chatsService.getAllChats(userId2)
    if (chat1 === undefined) throw new Error("Chat shouldn't be undefined!")
    if (chat2 === undefined) throw new Error("Chat shouldn't be undefined!")
    await messagesService.sendTextMessage(chat1.id, userId1, "hello")

    await expect(messagesService.getAllChatMessages(chat1.id, userId2)).rejects.toThrow("User is NOT the chat's participant!")
    await expect(messagesService.getAllChatMessages(chat2.id, userId2)).rejects.toThrow("There are no messages in the chat!")
  })

  test("message should be read", async () => {
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

    await chatsService.createGroupChat("Chat1", userId1)
    const [chat] = await chatsService.getAllChats(userId1)
    if (chat === undefined) throw new Error("Chat shouldn't be undefined!")
    await chatsService.addParticipantToChat(chat.id, userId2,userId1)

    await messagesService.sendTextMessage(chat.id, userId1, "hello")
    const messages = await messagesService.getAllChatMessages(chat.id, userId1)
    if (messages[0] === undefined) throw new Error("Message shouldn;t be undefined!")
    const wasMessageRead = await messagesService.readMessage(messages[0]?.id, userId2)
    const updatedMessages = await messagesService.getAllChatMessages(chat.id, userId1)
    if (updatedMessages[0] === undefined) throw new Error("Message shouldn't be undefined!")

    expect(wasMessageRead).toEqual(true)
    expect(updatedMessages[0].read).toEqual(1)
  })

  test("message shouldn't be read by message sender", async () => {
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

    await chatsService.createGroupChat("Chat1", userId1)
    const [chat] = await chatsService.getAllChats(userId1)
    if (chat === undefined) throw new Error("Chat shouldn't be undefined!")
    await chatsService.addParticipantToChat(chat.id, userId2,userId1)

    await messagesService.sendTextMessage(chat.id, userId1, "hello")
    const messages = await messagesService.getAllChatMessages(chat.id, userId1)
    if (messages[0] === undefined) throw new Error("Message shouldn;t be undefined!")
    
    await expect (messagesService.readMessage(messages[0]?.id, userId1)).rejects.toThrow("Message sender has already read its own message!")
  })

  test("message shouldn't be read", async() => {
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

    await chatsService.createGroupChat("Chat1", userId1)
    const [chat] = await chatsService.getAllChats(userId1)
    if (chat === undefined) throw new Error("Chat shouldn't be undefined!")

    await messagesService.sendTextMessage(chat.id, userId1, "hello")
    const messages = await messagesService.getAllChatMessages(chat.id, userId1)
    if (messages[0] === undefined) throw new Error("Message shouldn;t be undefined!")

    await expect (messagesService.readMessage(messages[0]?.id, userId2)).rejects.toThrow("User is NOT the chat's participant!")
  })

  test("message should be liked", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();
    const messagesService = await createMessageService();

    const userData1 = new SignUpUserInput(
      "user16@gmail.com",
      "11111111",
      "user1",
      "User1",
      new Date("2002-03-16")
    );
    const userData2 = new SignUpUserInput(
      "user26@gmail.com",
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
    if (messages[0] === undefined) throw new Error("Message can't be undefined!")

    const wasMessageLiked = await messagesService.likeMessage(messages[0].id, userId2)
    const updatedMessages = await messagesService.getAllChatMessages(chat.id, userId2);
    if (updatedMessages[0] === undefined) throw new Error("Message can't be undefined!")

    expect(wasMessageLiked).toEqual(true)
    expect(updatedMessages[0].likes).toEqual(1)
  })

  test("message shouldn't be liked", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();
    const messagesService = await createMessageService();

    const userData1 = new SignUpUserInput(
      "user16@gmail.com",
      "11111111",
      "user1",
      "User1",
      new Date("2002-03-16")
    );
    const userData2 = new SignUpUserInput(
      "user26@gmail.com",
      "11111111",
      "user2",
      "User2",
      new Date("2002-03-16")
    );
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);

    await chatsService.createGroupChat("Group chat", userId1)
    const chats = await chatsService.getAllChats(userId1)
    if (chats[0] === undefined) throw new Error("Chat can't be undefined!")
    const chatId = chats[0].id

    await messagesService.sendTextMessage(chatId, userId1, "Hello")
    const messages = await messagesService.getAllChatMessages(chatId, userId1);
    if (messages[0] === undefined) throw new Error("Message can't be undefined!")
    const messageId = messages[0].id
    const messageLikes = await messagesService.getMessageLikes(messageId, userId1)

    await expect (messagesService.likeMessage(messageId, userId2)).rejects.toThrow("User is NOT the chat's participant!")
    expect(messageLikes.length).toEqual(0)
  })

  test("message shouldn't be liked", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();
    const messagesService = await createMessageService();

    const userData1 = new SignUpUserInput(
      "user16@gmail.com",
      "11111111",
      "user1",
      "User1",
      new Date("2002-03-16")
    );
    const userData2 = new SignUpUserInput(
      "user26@gmail.com",
      "11111111",
      "user2",
      "User2",
      new Date("2002-03-16")
    );
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);

    await chatsService.createOneToOneChat(userId1, userId1);
    const [chat] = await chatsService.getAllChats(userId1);
    if (chat === undefined) throw new Error("Chat shouldn't be undefined!");
    const chatId = chat.id

    await messagesService.sendTextMessage(
      chatId,
      userId1,
      "User, I send it to you!"
    );
    const [message] = await messagesService.getAllChatMessages(chatId, userId1);
    if (message === undefined) throw new Error("Message can't be undefined!")
    const messageId = message.id
    const messageLikes = await messagesService.getMessageLikes(messageId, userId1)

    await expect (messagesService.likeMessage(messageId, userId2)).rejects.toThrow("User is NOT the chat's participant!")
    expect(messageLikes.length).toEqual(0)
  })

  test ("message shouldn't be liked", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();
    const messagesService = await createMessageService();

    const userData1 = new SignUpUserInput(
      "user16@gmail.com",
      "11111111",
      "user1",
      "User1",
      new Date("2002-03-16")
    );
    const userData2 = new SignUpUserInput(
      "user26@gmail.com",
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
    const [message] = await messagesService.getAllChatMessages(chat.id, userId2);
    if (message === undefined) throw new Error("Message can't be undefined!")
    const messageId = message.id
    await messagesService.likeMessage(messageId, userId2)
    const messageLikes = await messagesService.getMessageLikes(messageId, userId1)
    
    await expect (messagesService.likeMessage(messageId, userId2)).rejects.toThrow("Message was already liked by this user!")
    expect(messageLikes.length).toEqual(1)
  })

  test("like should be added", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();
    const messagesService = await createMessageService();

    const userData1 = new SignUpUserInput(
      "user16@gmail.com",
      "11111111",
      "user1",
      "User1",
      new Date("2002-03-16")
    );
    const userData2 = new SignUpUserInput(
      "user26@gmail.com",
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
    const [message] = await messagesService.getAllChatMessages(chat.id, userId2);
    if (message === undefined) throw new Error("Message can't be undefined!")
    const messageId = message.id

    const wasLikeAdded = await messagesService.likeMessage(messageId, userId2)
    const messageLikes = await messagesService.getMessageLikes(messageId, userId2)
    
    expect(wasLikeAdded).toEqual(true)
    expect(messageLikes.length).toEqual(1)
  })
});
