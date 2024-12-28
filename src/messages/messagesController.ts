import express from "express";
import { validation } from "../common/middlewares/validation";
import { sendTextMessageSchema } from "./schemas/sendTextMessageSchema";
import { auth } from "../common/middlewares/auth";
import { runInTransaction } from "../common/middlewares/transaction";
import { MessagesRepository } from "./messagesRepository";
import { MessagesService } from "./messagesService";
import { MyRequest } from "../common/requestDefinition";
import { getAllChatMessagesSchema } from "./schemas/getAllChatMessagesSchema";
import { unsendMessageSchema } from "./schemas/unsendMessageSchema";
import { editTextMessageSchema } from "./schemas/editTextMessageSchema";
import { readMessageSchema } from "./schemas/readMessageSchema";
import { likeMessageSchema } from "./schemas/likeMessageSchema";
import { getMessageLikesSchema } from "./schemas/getMessageLikesSchema";

export const router = express.Router();

router.post(
  "/text-message",
  validation(sendTextMessageSchema),
  auth(),
  async (req, res) => {
    try {
      await runInTransaction(async (connection) => {
        const messagesRepository = new MessagesRepository(connection);
        const messagesService = new MessagesService(messagesRepository);

        const { chatId, textContent } = req.body;

        const wasTextMessageAdded = await messagesService.sendTextMessage(
          chatId,
          (req as MyRequest).userId,
          textContent
        );
        if (!wasTextMessageAdded) {
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

router.get(
  "/chat-messages",
  validation(getAllChatMessagesSchema),
  auth(),
  async (req, res) => {
    try {
      const messages = await runInTransaction(async (connection) => {
        const messagesRepository = new MessagesRepository(connection);
        const messagesService = new MessagesService(messagesRepository);

        const { chatId } = req.body;

        const messages = await messagesService.getAllChatMessages(
          chatId,
          (req as MyRequest).userId
        );
        if (!messages) {
          res.json({ success: false });
        } else {
          res.json({ messages });
        }
      });
      return messages;
    } catch (error) {
      console.log(error);
      res.json({ success: false });
    }
  }
);

router.delete(
  "/unsend-message",
  validation(unsendMessageSchema),
  auth(),
  async (req, res) => {
    try {
      await runInTransaction(async (connection) => {
        const messagesRepository = new MessagesRepository(connection);
        const messagesService = new MessagesService(messagesRepository);

        const { messageId } = req.body;
        const wasMessageUnsended = await messagesService.unsendMessage(
          messageId,
          (req as MyRequest).userId
        );
        if (!wasMessageUnsended) {
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

router.patch("/text-message", validation(editTextMessageSchema), auth(), async (req, res) => {
  try {
    await runInTransaction(async (connection) => {
      const messagesRepository = new MessagesRepository(connection)
      const messagesService = new MessagesService(messagesRepository)

      const { messageId, newMessage } = req.body
      const wasTextMessageEdited = await messagesService.editTextMessage(messageId, newMessage, (req as MyRequest).userId)
      if (!wasTextMessageEdited) {
        res.json({ success: false })
      } else {
        res.json({ success: true })
      }
    })
  } catch (error) {
    console.log(error)
    res.json({ success: false })
  }
})

router.patch("/read-message", validation(readMessageSchema), auth(), async (req, res) => {
  try {
    await runInTransaction(async (connection) => {
      const messagesRepository = new MessagesRepository(connection)
      const messagesService = new MessagesService(messagesRepository)

      const { messageId } = req.body
      const wasMessageRead = await messagesService.readMessage(messageId, (req as MyRequest).userId)
      if (!wasMessageRead) {
        res.json({ success: false })
      } else {
        res.json({ success: true })
      }
    })
  } catch (error) {
    console.log(error)
    res.json({ success: false })
  }
})

router.patch("/like-message", validation(likeMessageSchema), auth(), async (req, res) => {
  try {
    await runInTransaction(async (connection) => {
      const messagesRepository = new MessagesRepository(connection)
      const messagesService = new MessagesService(messagesRepository)

      const { messageId } = req.body
      const wasMessageLiked = await messagesService.likeMessage(messageId, (req as MyRequest).userId)
      if (!wasMessageLiked) {
        res.json({ success: false })
      } else {
        res.json({ success: true })
      }
    })
  } catch (error) {
    console.log(error)
    res.json({ success: false })
  }
})

router.get("/get-likes", validation(getMessageLikesSchema), auth(), async (req, res) => {
  try {
    const messageLikes = await runInTransaction(async (connection) => {
      const messagesRepository = new MessagesRepository(connection)
      const messagesService = new MessagesService(messagesRepository)

      const { messageId } = req.body
      const messageLikes = await messagesService.getMessageLikes(messageId, (req as MyRequest).userId)
      if (!messageLikes) {
        res.json({ success: false })
      } else {
        res.json({messageLikes})
      }
    })
    return messageLikes
  } catch (error) {
    console.log(error)
    res.json({ success: false })
  }
})
