import { RowDataPacket } from "mysql2/promise"

export interface IGetUserQueryResult extends RowDataPacket {
    userId: string,
    email: string,
    password: string,
    userName: string,
    fullName: string,
    dateOfBirth: Date
}