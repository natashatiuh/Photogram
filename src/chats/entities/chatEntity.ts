export class ChatEntity {
  id: string;
  type: string;
  createdAt: Date;
  name?: string;
  cover?: string;
  creatorId?: string;
  user1?: string;
  user2?: string;

  constructor(
    id: string,
    type: string,
    createdAt: Date,
    name?: string,
    cover?: string,
    creatorId?: string,
    user1?: string,
    user2?: string
  ) {
    (this.id = id), (this.type = type);
    this.name = name;
    this.type = type;
    this.createdAt = createdAt;
    this.cover = cover;
    this.creatorId = creatorId;
    this.user1 = user1;
    this.user2 = user2;
  }
}
