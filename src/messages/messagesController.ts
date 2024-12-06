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
