export class UserPhotoEntity {
  id: string;
  type: string;
  userId: string;
  description: string;
  likes: number;
  markedUsers: boolean;
  archived: boolean;
  views: number;
  sharings: number;
  savings: number;
  dateOfPublishing: Date;

  constructor(
    id: string,
    type: string,
    userId: string,
    description: string,
    likes: number,
    markedUsers: boolean,
    archived: boolean,
    views: number,
    sharings: number,
    savings: number,
    dateOfPublishing: Date
  ) {
    (this.id = id), (this.type = type);
    this.userId = userId;
    this.description = description;
    this.likes = likes;
    this.markedUsers = markedUsers;
    this.archived = archived;
    this.views = views;
    this.sharings = sharings;
    this.savings = savings;
    this.dateOfPublishing = dateOfPublishing;
  }
}
