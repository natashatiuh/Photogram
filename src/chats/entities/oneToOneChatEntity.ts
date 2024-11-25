export class OneToOneChatEntity {
  id: string;
  type: string;
  user1: string;
  user2: string;
  createdAt: Date;

  constructor(
    id: string,
    type: string,
    user1: string,
    user2: string,
    createdAt: Date
  ) {
    this.id = id;
    this.type = type;
    this.user1 = user1;
    this.user2 = user2;
    this.createdAt = createdAt;
  }
}
