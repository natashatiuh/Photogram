export class SavedContentEntity {
  id: string;
  postId: string;
  saverId: string;

  constructor(id: string, postId: string, saverId: string) {
    this.id = id;
    this.postId = postId;
    this.saverId = saverId;
  }
}
