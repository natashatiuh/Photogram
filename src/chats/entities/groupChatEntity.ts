export class GroupChatEntity {
  id: string;
  name: string;
  creatorId: string;
  createdAt: Date;

  constructor(id: string, name: string, creatorId: string, createdAt: Date) {
    (this.id = id), (this.name = name), (this.creatorId = creatorId);
    this.createdAt = createdAt;
  }
}
