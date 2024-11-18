export class GroupChatEntity {
  id: string;
  name: string;
  cover: string;
  creatorId: string;
  createdAt: Date;

  constructor(
    id: string,
    name: string,
    cover: string,
    creatorId: string,
    createdAt: Date
  ) {
    (this.id = id),
      (this.name = name),
      (this.cover = cover),
      (this.creatorId = creatorId),
      (this.createdAt = createdAt);
  }
}
