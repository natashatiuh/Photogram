import { RowDataPacket } from "mysql2";

export interface IGetChatIdQueryResults extends RowDataPacket {
  chatId: string;
}

export interface IGetAllMessageQueryResults extends RowDataPacket {
  id: string;
  chatId: string;
  senderId: string;
  type: string;
  textContent?: string;
  mediaUrl?: string;
  sharedPostId?: string;
  sentAt: Date;
}

export interface IGetChatParticipantsQueryResults extends RowDataPacket {
  participantId: string;
}

export interface IGetOneToOneChatUsersQueryResults extends RowDataPacket {
  user1: string;
  user2: string;
}


export interface IGetMessageIdQueryResults extends RowDataPacket {
  messageId: string
}