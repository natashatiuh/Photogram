import { RowDataPacket } from "mysql2";

export interface IGetOneToOneUserChatsQueryResults extends RowDataPacket {
  id: string;
  type: string;
  user1: string;
  user2: string;
  createdAt: Date;
}

export interface IGetUserGroupChatsQueryResults extends RowDataPacket {
  id: string;
  type: string;
  name: string;
  cover: string;
  creatorId: string;
  createdAt: Date;
}

export interface IGetChatParticipantsQueryResults extends RowDataPacket {
  participantId: string;
}

export interface IGetChatIdQueryResults extends RowDataPacket {
  chatId: string;
}

export interface IGetChatDetailsQueryResults extends RowDataPacket {
  id: string;
  type: string;
  createdAt: Date;
  name?: string;
  cover?: string;
  creatorId?: string;
  user1?: string;
  user2?: string;
}
