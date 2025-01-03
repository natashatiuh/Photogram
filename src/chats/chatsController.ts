import express from "express";
import multer from "multer";
import path from "path";
import { validation } from "../common/middlewares/validation";
import { createOneToOneChatSchema } from "./schemas/createOneToOneChatSchema";
import { auth } from "../common/middlewares/auth";
import { runInTransaction } from "../common/middlewares/transaction";
import { ChatsRepository } from "./chatsRepository";
import { ChatsService } from "./chatsService";
import { MyRequest } from "../common/requestDefinition";
import { createGroupChatSchema } from "./schemas/createGroupChatSchema";
import { addParticipantToChatSchema } from "./schemas/addParticipantToChatSchema";
import { deleteParticipantFromChatSchema } from "./schemas/deleteParticipantFromChatSchema";
import { editGroupChatNameSchema } from "./schemas/editGroupChatNameSchema";
import { changeChatCoverSchema } from "./schemas/changeChatCover";
import { v4 } from "uuid";
import { deleteChatCoverSchema } from "./schemas/deleteChatCoverSchema";
import { leaveGroupChatSchema } from "./schemas/leaveGroupChatSchema";
import { deleteGroupChatPermanentlySchema } from "./schemas/deleteGroupChatPermanentlySchema";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/chats-covers");
  },
  filename: (req, file, cb) => {
    cb(null, v4() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
});

export const router = express.Router();

router.post(
  "/one-to-one",
  validation(createOneToOneChatSchema),
  auth(),
  async (req, res) => {
    try {
      await runInTransaction(async (connection) => {
        const chatsRepository = new ChatsRepository(connection);
        const chatsService = new ChatsService(chatsRepository);

        const { recipientId } = req.body;
        const wasChatCreated = await chatsService.createOneToOneChat(
          (req as MyRequest).userId,
          recipientId
        );
        if (!wasChatCreated) {
          res.json({ success: false });
        } else {
          res.json({ success: true });
        }
      });
    } catch (error) {
      console.log(error);
      res.json({ success: false });
    }
  }
);

router.get("/one-to-one", auth(), async (req, res) => {
  try {
    const userChats = await runInTransaction(async (connection) => {
      const chatsRepository = new ChatsRepository(connection);
      const chatsService = new ChatsService(chatsRepository);

      const userChats = await chatsService.getUserOneToOneChats(
        (req as MyRequest).userId
      );
      if (!userChats) {
        res.json({ success: false });
      } else {
        res.json({ userChats });
      }
    });
    return userChats;
  } catch (error) {
    console.log(error);
    res.json({ success: false });
  }
});

router.post(
  "/group",
  validation(createGroupChatSchema),
  auth(),
  async (req, res) => {
    try {
      await runInTransaction(async (connection) => {
        const chatsRepository = new ChatsRepository(connection);
        const chatsService = new ChatsService(chatsRepository);

        const { name } = req.body;
        const wasChatCreated = await chatsService.createGroupChat(
          name,
          (req as MyRequest).userId
        );
        if (!wasChatCreated) {
          res.json({ success: false });
        } else {
          res.json({ success: true });
        }
      });
    } catch (error) {
      console.log(error);
      res.json({ success: false });
    }
  }
);

router.get("/group", auth(), async (req, res) => {
  try {
    const userChats = await runInTransaction(async (connection) => {
      const chatsRepository = new ChatsRepository(connection);
      const chatsService = new ChatsService(chatsRepository);

      const userChats = await chatsService.getUserGroupChats(
        (req as MyRequest).userId
      );
      if (!userChats) {
        res.json({ success: false });
      } else {
        res.json({ userChats });
      }
    });
    return userChats;
  } catch (error) {
    console.log(error);
    res.json({ success: false });
  }
});

router.post(
  "/add-participant",
  validation(addParticipantToChatSchema),
  auth(),
  async (req, res) => {
    try {
      await runInTransaction(async (connection) => {
        const chatsRepository = new ChatsRepository(connection);
        const chatsService = new ChatsService(chatsRepository);

        const { chatId, participantId } = req.body;
        const wasParticipantAdded = await chatsService.addParticipantToChat(
          chatId,
          participantId,
          (req as MyRequest).userId
        );
        if (!wasParticipantAdded) {
          res.json({ success: false });
        } else {
          res.json({ success: true });
        }
      });
    } catch (error) {
      console.log(error);
      res.json({ success: false });
    }
  }
);

router.delete(
  "/participant",
  validation(deleteParticipantFromChatSchema),
  auth(),
  async (req, res) => {
    try {
      await runInTransaction(async (connection) => {
        const chatsRepository = new ChatsRepository(connection);
        const chatsService = new ChatsService(chatsRepository);

        const { chatId, participantId } = req.body;
        const wasParticipantDeleted =
          await chatsService.deleteParticipantFromChat(
            chatId,
            participantId,
            (req as MyRequest).userId
          );
        if (!wasParticipantDeleted) {
          res.json({ success: false });
        } else {
          res.json({ success: true });
        }
      });
    } catch (error) {
      console.log(error);
      res.json({ success: false });
    }
  }
);

router.delete(
  "/leave-chat",
  validation(leaveGroupChatSchema),
  auth(),
  async (req, res) => {
    try {
      await runInTransaction(async (connection) => {
        const chatsRepository = new ChatsRepository(connection);
        const chatsService = new ChatsService(chatsRepository);

        const { chatId } = req.body;
        const didUserLeaveTheChat = await chatsService.leaveGroupChat(
          chatId,
          (req as MyRequest).userId
        );
        if (!didUserLeaveTheChat) {
          res.json({ success: false });
        } else {
          res.json({ success: true });
        }
      });
    } catch (error) {
      res.json({ success: false });
    }
  }
);

router.patch(
  "/chat-name",
  validation(editGroupChatNameSchema),
  auth(),
  async (req, res) => {
    try {
      await runInTransaction(async (connection) => {
        const chatsRepository = new ChatsRepository(connection);
        const chatsService = new ChatsService(chatsRepository);

        const { newName, chatId } = req.body;
        const wasChatNameChanged = await chatsService.editGroupChatName(
          newName,
          chatId,
          (req as MyRequest).userId
        );
        if (!wasChatNameChanged) {
          res.json({ success: false });
        } else {
          res.json({ success: true });
        }
      });
    } catch (error) {
      console.log(error);
      res.json({ success: false });
    }
  }
);

router.patch(
  "/change-cover",
  validation(changeChatCoverSchema),
  auth(),
  upload.single("cover"),
  async (req, res) => {
    try {
      await runInTransaction(async (connection) => {
        const chatsRepository = new ChatsRepository(connection);
        const chatsService = new ChatsService(chatsRepository);

        const cover = req.file?.filename;
        if (cover === undefined) return;
        const { chatId } = req.body;
        const wasCoverChanged = await chatsService.changeChatCover(
          chatId,
          cover,
          (req as MyRequest).userId
        );
        if (!wasCoverChanged) {
          res.json({ success: false });
        } else {
          res.json({ success: true });
        }
      });
    } catch (error) {
      console.log(error);
      res.json({ success: false });
    }
  }
);

router.patch(
  "/delete-cover",
  validation(deleteChatCoverSchema),
  auth(),
  async (req, res) => {
    try {
      await runInTransaction(async (connection) => {
        const chatsRepository = new ChatsRepository(connection);
        const chatsService = new ChatsService(chatsRepository);

        const { chatId } = req.body;
        const wasCoverDeleted = await chatsService.deleteChatCover(
          chatId,
          (req as MyRequest).userId
        );
        if (!wasCoverDeleted) {
          res.json({ success: false });
        } else {
          res.json({ success: true });
        }
      });
    } catch (error) {
      console.log(error);
      res.json({ success: false });
    }
  }
);

router.get("/all-chats", auth(), async (req, res) => {
  try {
    const userChats = await runInTransaction(async (connection) => {
      const chatsRepository = new ChatsRepository(connection);
      const chatsService = new ChatsService(chatsRepository);

      const userChats = await chatsService.getAllChats(
        (req as MyRequest).userId
      );
      if (!userChats) {
        res.json({ success: false });
      } else {
        res.json({ userChats });
      }
    });
    return userChats;
  } catch (error) {
    console.log(error);
    res.json({ success: false });
  }
});

router.delete(
  "/group-chat",
  validation(deleteGroupChatPermanentlySchema),
  auth(),
  async (req, res) => {
    try {
      await runInTransaction(async (connection) => {
        const chatsRepository = new ChatsRepository(connection);
        const chatsService = new ChatsService(chatsRepository);

        const { chatId } = req.body;
        const wasChatDeleted = await chatsService.deleteGroupChatPermanently(
          chatId,
          (req as MyRequest).userId
        );
        if (!wasChatDeleted) {
          res.json({ success: false });
        } else {
          res.json({ success: true });
        }
      });
    } catch (error) {
      console.log(error);
      res.json({ success: false });
    }
  }
);
