import express from "express";
import { validation } from "../common/middlewares/validation";
import { createOneToOneChatSchema } from "./schemas/createOneToOneChatSchema";
import { auth } from "../common/middlewares/auth";
import { runInTransaction } from "../common/middlewares/transaction";
import { ChatsRepository } from "./chatsRepository";
import { ChatsService } from "./chatsService";
import { MyRequest } from "../common/requestDefinition";

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

        const { recipientId, firstMessage } = req.body;
        const wasChatCreated = await chatsService.createOneToOneChat(
          (req as MyRequest).userId,
          recipientId,
          firstMessage
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
