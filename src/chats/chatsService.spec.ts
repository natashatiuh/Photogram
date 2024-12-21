import dotenv from "dotenv";
dotenv.config();
import { PoolConnection } from "mysql2/promise";
import { pool } from "../common/connection";
import { AuthRepository } from "../auth/authRepository";
import { AuthService } from "../auth/authService";
import { UsersService } from "../users/usersService";
import { PhotosRepository } from "../photos/photosRepository";
import { PhotosService } from "../photos/photosService";
import { ChatsRepository } from "./chatsRepository";
import { ChatsService } from "./chatsService";
import { SignUpUserInput } from "../auth/inputs/signUpUserInput";

jest.setTimeout(6 * 1000);

describe("Chats Service", () => {
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

  async function createChatsRepository() {
    const chatsRepository = new ChatsRepository(connection)
    return chatsRepository
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
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);
    await chatsService.createOneToOneChat(userId1, userId2);
    const user1Chats = await chatsService.getUserOneToOneChats(userId1);
    const user2Chats = await chatsService.getUserOneToOneChats(userId2);

    expect(user1Chats.length).toEqual(1);
    expect(user2Chats.length).toEqual(1);
  });

  test("one-to-one chat should be only one between 2 users", async () => {
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
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);
    await chatsService.createOneToOneChat(userId1, userId2);
    const user1Chats = await chatsService.getUserOneToOneChats(userId1);
    const user2Chats = await chatsService.getUserOneToOneChats(userId2);

    expect(user1Chats.length).toEqual(1);
    expect(user2Chats.length).toEqual(1);
    await expect(
      chatsService.createOneToOneChat(userId2, userId1)
    ).rejects.toThrow("The chat between users is already exist!");
  });

  test("one-to-one chat should exist", async () => {
    const authService = await createAuthService()
    const chatsRepository = await createChatsRepository()
    const chatsService = await createChatsService()

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

    const { userId: userId1 } = await authService.signUpUser(userData1)
    const { userId: userId2 } = await authService.signUpUser(userData2)

    await chatsService.createOneToOneChat(userId1, userId2)
    const isChatExist = await chatsRepository.checkIfOneToOneChatExists(userId1, userId2)

    expect(isChatExist).toEqual(true)
  })

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
    const { userId: userId } = await authService.signUpUser(userData);
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
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);

    await chatsService.createGroupChat("Classmates group", userId1);
    const chat = await chatsService.getUserGroupChats(userId1);
    const chatId = chat[0]?.id;
    if (chatId === undefined) throw new Error("ChatId shouldn't be undefined!");

    await chatsService.addParticipantToChat(chatId, userId2, userId1);
    const chatParticipants = await chatsService.getChatParticipants(chatId);

    expect(chatParticipants.length).toEqual(2);
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
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);
  
    await chatsService.createGroupChat("Classmates group", userId1);
    const chat = await chatsService.getUserGroupChats(userId1);
    const chatId = chat[0]?.id;
    if (chatId === undefined) throw new Error("ChatId shouldn't be undefined!");
    await chatsService.deleteGroupChatPermanently(chatId, userId1)
      
    await expect(chatsService.getChatParticipants(chatId)).rejects.toThrow("There are NO participants in chat!")
  })

  test("participant who is already in the chat should NOT be added to the chat", async () => {
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
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);

    await chatsService.createGroupChat("Classmates", userId1);
    const chats = await chatsService.getUserGroupChats(userId1);
    const chatId = chats[0]?.id;
    if (chatId === undefined) throw new Error("ChatId shouldn't be undefined!");

    await chatsService.addParticipantToChat(chatId, userId2, userId1);
    const user1Chats = await chatsService.getAllChats(userId1);
    const user2Chats = await chatsService.getAllChats(userId2);
    const participants = await chatsService.getChatParticipants(chatId);

    expect(user1Chats.length).toEqual(1);
    expect(user2Chats.length).toEqual(1);
    expect(participants.length).toEqual(2);
    await expect(
      chatsService.addParticipantToChat(chatId, userId2, userId1)
    ).rejects.toThrow("This user is already in the chat!");
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
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);

    await chatsService.createGroupChat("Classmates group", userId1);
    const chat = await chatsService.getUserGroupChats(userId1);
    const chatId = chat[0]?.id;
    if (chatId === undefined) throw new Error("ChatId shouldn't be undefined!");

    await chatsService.addParticipantToChat(chatId, userId2, userId1);
    const chatParticipants = await chatsService.getChatParticipants(chatId);
    await chatsService.deleteParticipantFromChat(chatId, userId2, userId1);
    const updatedChatParticipants = await chatsService.getChatParticipants(
      chatId
    );

    expect(chatParticipants.length).toEqual(2);
    expect(updatedChatParticipants.length).toEqual(1);
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
    const userData3 = new SignUpUserInput(
      "user3@gmail.com",
      "11111111",
      "user3",
      "User3",
      new Date("2002-03-16")
    );
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);
    const { userId: userId3 } = await authService.signUpUser(userData3);

    await chatsService.createGroupChat("Classmates group", userId1);
    const chat = await chatsService.getUserGroupChats(userId1);
    const chatId = chat[0]?.id;
    if (chatId === undefined) throw new Error("ChatId shouldn't be undefined!");

    await chatsService.addParticipantToChat(chatId, userId2, userId1);
    await chatsService.addParticipantToChat(chatId, userId3, userId1);
    await chatsService.leaveGroupChat(chatId, userId2);
    const chatParticipants = await chatsService.getChatParticipants(chatId);

    expect(chatParticipants.length).toEqual(2);
    await expect(chatsService.leaveGroupChat(chatId, userId1)).rejects.toThrow(
      "Chat creator can NOT leave the chat!"
    );
  });

  test("participant shouldn't be deleted from the chat", async () => {
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
    const userData3 = new SignUpUserInput(
      "user3@gmail.com",
      "11111111",
      "user3",
      "User3",
      new Date("2002-03-16")
    );
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);

    await chatsService.createGroupChat("Classmates group", userId1);
    const chat = await chatsService.getUserGroupChats(userId1);
    const chatId = chat[0]?.id;
    if (chatId === undefined) throw new Error("ChatId shouldn't be undefined!")

    await expect(chatsService.deleteParticipantFromChat(chatId, userId2, userId1)).rejects.toThrow("This user is NOT in the chat!")
  })

  test("chat name should be changed", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();

    const userData = new SignUpUserInput(
      "user1@gmail.com",
      "11111111",
      "user1",
      "User1",
      new Date("2002-03-16")
    );
    const { userId: userId } = await authService.signUpUser(userData);

    await chatsService.createGroupChat("Classmates group", userId);
    const chat = await chatsService.getUserGroupChats(userId);
    const chatId = chat[0]?.id;
    const chatName = chat[0]?.name;
    if (chatId === undefined || chatName === undefined)
      throw new Error("ChatId or ChatName shouldn't be undefined!");

    await chatsService.editGroupChatName("New Year Chat", chatId, userId);
    const editedChat = await chatsService.getUserGroupChats(userId);
    const editedChatId = editedChat[0]?.id;
    const editedChatName = editedChat[0]?.name;
    if (editedChatId === undefined || editedChatName === undefined)
      throw new Error("ChatId or CharName shouldn't be undefined!");

    expect(chatName).toEqual("Classmates group");
    expect(editedChatName).toEqual("New Year Chat");
  });

  test("chat cover should be added", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();

    const userData = new SignUpUserInput(
      "user1@gmail.com",
      "11111111",
      "user1",
      "User1",
      new Date("2002-03-16")
    );
    const { userId: userId } = await authService.signUpUser(userData);

    await chatsService.createGroupChat("Classmates group", userId);
    const chat = await chatsService.getUserGroupChats(userId);
    const chatId = chat[0]?.id;
    if (chatId === undefined) throw new Error("ChatId shouldn't be undefined!");

    await chatsService.changeChatCover(chatId, "cover1", userId);
    const updatedChat = await chatsService.getUserGroupChats(userId);
    const cover = updatedChat[0]?.cover;
    if (cover === undefined) throw new Error("Cover shouldn't be undefined!");

    expect(cover).toEqual("cover1");
  });

  test("chat cover should be changed", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();

    const userData = new SignUpUserInput(
      "user1@gmail.com",
      "11111111",
      "user1",
      "User1",
      new Date("2002-03-16")
    );
    const { userId: userId } = await authService.signUpUser(userData);

    await chatsService.createGroupChat("Classmates group", userId);
    const chat = await chatsService.getUserGroupChats(userId);
    const chatId = chat[0]?.id;
    if (chatId === undefined) throw new Error("ChatId shouldn't be undefined!");

    await chatsService.changeChatCover(chatId, "cover1", userId);
    const changedChat = await chatsService.getUserGroupChats(userId);
    const cover = changedChat[0]?.cover;
    if (cover === undefined) throw new Error("Cover shouldn't be undefined!");
    console.log(`Updating cover for chatId: ${chatId}, new cover: ${cover}`);
    await chatsService.changeChatCover(chatId, "cover2", userId);

    const updatedCoverChat = await chatsService.getUserGroupChats(userId);
    const updatedCover = updatedCoverChat[0]?.cover;
    if (updatedCover === undefined)
      throw new Error("Cover shouldn't be undefined!");

    expect(cover).toEqual("cover1");
    expect(updatedCover).toEqual("cover2");
  });

  test("chat cover should be added", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();

    const userData = new SignUpUserInput(
      "user1@gmail.com",
      "11111111",
      "user1",
      "User1",
      new Date("2002-03-16")
    );
    const { userId: userId } = await authService.signUpUser(userData);

    await chatsService.createGroupChat("Classmates group", userId);
    const chat = await chatsService.getUserGroupChats(userId);
    const chatId = chat[0]?.id;
    if (chatId === undefined) throw new Error("ChatId shouldn't be undefined!");

    await chatsService.changeChatCover(chatId, "cover1", userId);
    const updatedChat = await chatsService.getUserGroupChats(userId);
    const cover = updatedChat[0]?.cover;
    if (cover === undefined) throw new Error("Cover shouldn't be undefined!");
    await chatsService.deleteChatCover(chatId, userId);

    const deletedCoverChat = await chatsService.getUserGroupChats(userId);
    const deletedCover = deletedCoverChat[0]?.cover;

    expect(cover).toEqual("cover1");
    expect(deletedCover).toEqual(null);
  });

  test("user should get all chats where he is a participant or a creator", async () => {
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
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);

    await chatsService.createOneToOneChat(userId1, userId2);
    await chatsService.createGroupChat("Hello", userId1);
    const [chat1] = await chatsService.getUserGroupChats(userId1);
    if (chat1 === undefined) throw new Error("ChatId shouldn't be undefined!");

    const chatId1 = chat1.id;
    await chatsService.addParticipantToChat(chatId1, userId2, userId1);

    await chatsService.createGroupChat("Hello 2", userId2);
    const user2GroupChats = await chatsService.getUserGroupChats(userId2);
    const user2Chat = user2GroupChats.find(
      (chat) => chat.creatorId === userId2
    );
    if (user2Chat === undefined)
      throw new Error("ChatId shouldn't be undefined!");

    const chatId2 = user2Chat.id;
    await chatsService.addParticipantToChat(chatId2, userId1, userId2);

    const user1Chats = await chatsService.getAllChats(userId1);
    const user2Chats = await chatsService.getAllChats(userId2);

    expect(user1Chats.length).toEqual(3);
    expect(user2Chats.length).toEqual(3);
  });

  test("group chat and its participants should be deleted", async () => {
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
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);

    await chatsService.createGroupChat("Group Chat1", userId1);
    await chatsService.createGroupChat("Group Chat2", userId1);
    const [chat1, chat2] = await chatsService.getUserGroupChats(userId1);
    if (chat1 === undefined) throw new Error("Chat shouldn't be undefined!");
    if (chat2 === undefined) throw new Error("Chat shouldn't be undefined!");

    await chatsService.addParticipantToChat(chat1.id, userId2, userId1);
    await chatsService.addParticipantToChat(chat2.id, userId2, userId1);
    await chatsService.deleteGroupChatPermanently(chat1.id, userId1);
    const user1Chats = await chatsService.getUserGroupChats(userId1);
    const chat2Participants = await chatsService.getChatParticipants(chat2.id);

    expect(user1Chats.length).toEqual(1);
    expect(chat2Participants.length).toEqual(2);
  });

  test ("user should have no chats", async () => {
    const authService = await createAuthService();
    const chatsService = await createChatsService();
    const userData = new SignUpUserInput(
      "user1@gmail.com",
      "11111111",
      "user1",
      "User1",
      new Date("2002-03-16")
    );    
    const { userId } = await authService.signUpUser(userData);

    await expect(chatsService.getAllChats(userId)).rejects.toThrow("There are no chats!")
  })

  test("user should leave the chat", async () => {
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
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);

    await chatsService.createGroupChat("Group Chat1", userId1);
    const [chat] = await chatsService.getUserGroupChats(userId1);
    if (chat === undefined) throw new Error("Chat shouldn't be undefined!")
    await chatsService.addParticipantToChat(chat.id, userId2, userId1)
    await chatsService.leaveGroupChat(chat.id, userId2)
    const chatParticipants = await chatsService.getChatParticipants(chat.id)

    expect(chatParticipants.length).toEqual(1)
  })

  test("user should not leave the chat", async () => {
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
    const { userId: userId1 } = await authService.signUpUser(userData1);
    const { userId: userId2 } = await authService.signUpUser(userData2);

    await chatsService.createGroupChat("Group Chat1", userId1);
    const [chat] = await chatsService.getUserGroupChats(userId1);
    if (chat === undefined) throw new Error("Chat shouldn't be undefined!")
    await chatsService.addParticipantToChat(chat.id, userId2, userId1)
    
    await expect(chatsService.leaveGroupChat(chat.id, userId1)).rejects.toThrow("Chat creator can NOT leave the chat!")
  })

})
