export class PhotoLikeEntity {
  id: string;
  postId: string;
  likedBy: string;

  constructor(id: string, postId: string, likedBy: string) {
    (this.id = id), (this.postId = postId), (this.likedBy = likedBy);
  }
}
