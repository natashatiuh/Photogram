export class GroupChatEntity {
  id: string;
  type: string;
  name: string;
  cover: string;
  creatorId: string;
  createdAt: Date;

  constructor(
    id: string,
    type: string,
    name: string,
    cover: string,
    creatorId: string,
    createdAt: Date
  ) {
    (this.id = id),
      (this.type = type),
      (this.name = name),
      (this.cover = cover),
      (this.creatorId = creatorId),
      (this.createdAt = createdAt);
  }
}
