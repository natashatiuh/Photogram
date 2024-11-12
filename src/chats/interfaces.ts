import { RowDataPacket } from "mysql2";

export interface IGetUserChatsQueryResults extends RowDataPacket {
  id: string;
  user1: string;
  user2: string;
  createdAt: Date;
}
