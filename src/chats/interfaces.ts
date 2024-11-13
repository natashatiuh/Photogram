import { RowDataPacket } from "mysql2";

export interface IGetOneToOneUserChatsQueryResults extends RowDataPacket {
  id: string;
  user1: string;
  user2: string;
  createdAt: Date;
}

export interface IGetUserGroupChatsQueryResults extends RowDataPacket {
  id: string;
  name: string;
  creatorId: string;
  createdAt: Date;
}
