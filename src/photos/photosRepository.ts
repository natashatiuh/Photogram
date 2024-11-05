import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { UserPhotoEntity } from "./entity/userPhotoEntity";
import { v4 } from "uuid";
import { SavedContentEntity } from "./entity/savedContentEntity";
import { PhotoLikeEntity } from "./entity/photoLikeEntity";
import {
  IGetArchivedQueryResult,
  IGetLikesQueryResult,
  IGetMarkedUsersQueryResult,
  IGetPhotoQueryResult,
  IGetSavedContentQueryResult,
  IGetSavingsQueryResult,
  IGetSharingsQueryResult,
} from "./interfaces";
import { MarkedUsersEntity } from "./entity/markedUsersEntity";

export class PhotosRepository {
  constructor(private connection: PoolConnection) {}

  async addPhoto(userId: string, description: string, photo?: string) {
    const startDate = new Date();
    const query = `
            INSERT INTO posts 
            (id, type, userId, description, likes, markedUsers, archived, views, sharings, savings, dateOfPublishing)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const params = [
      photo,
      "photo",
      userId,
      description,
      0,
      false,
      false,
      0,
      0,
      0,
      startDate,
    ];
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async updateUserInfo(userId: string) {
    const query = `
            UPDATE users 
            SET posts = posts + 1
            WHERE id = ?
        `;
    const params = [userId];
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  //only user by itself can use this function, because this function shows all photos, even archieved
  async getAllUserPhotos(userId: string) {
    const query = `
            SELECT id, type, userId, description, likes, markedUsers, archived, views, sharings, savings, dateOfPublishing
            FROM posts 
            WHERE userId = ?
        `;
    const params = [userId];
    const [rows] = await this.connection.execute<IGetPhotoQueryResult[]>(
      query,
      params
    );
    if (rows.length === 0) {
      throw new Error("User has NO photos!");
    }

    const photos = rows.map(
      (photo) =>
        new UserPhotoEntity(
          photo.id,
          photo.type,
          photo.userId,
          photo.description,
          photo.likes,
          photo.markedUsers,
          photo.archived,
          photo.views,
          photo.sharings,
          photo.savings,
          photo.dateOfPublishing
        )
    );

    return photos;
  }

  async changePhotoDescription(
    photoId: string,
    newDescription: string,
    userId: string
  ) {
    const query = `
            UPDATE posts
            SET description = ?
            WHERE id = ? AND userId = ?
        `;
    const params = [newDescription, photoId, userId];
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async archivePhoto(photoId: string, userId: string) {
    const query = `
            UPDATE posts
            SET archived = true
            WHERE id = ? AND userId = ?
        `;
    const params = [photoId, userId];
    const isPhotoArchived = await this.checkIfPhotoIsAlreadyArchived(photoId);
    if (isPhotoArchived) throw new Error("The photo is already archived!");
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async unarchivePhoto(photoId: string, userId: string) {
    const query = `
            UPDATE posts
            SET archived = false
            WHERE id = ? AND userId = ?
        `;
    const params = [photoId, userId];
    const isPhotoArchived = await this.checkIfPhotoIsAlreadyArchived(photoId);
    if (!isPhotoArchived) throw new Error("Photo is NOT archived!");
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async checkIfPhotoIsAlreadyArchived(photoId: string) {
    const query = `
            SELECT archived FROM posts
            WHERE id = ?
        `;
    const params = [photoId];
    const [rows] = await this.connection.execute<IGetArchivedQueryResult[]>(
      query,
      params
    );
    if (rows.length === 0) return false;
    return rows[0]?.archived;
  }

  async savePhoto(photoId: string, saverId: string) {
    const query = `
            UPDATE posts
            SET savings = savings + 1
            WHERE id = ?
        `;
    const params = [photoId];

    const isPhotoSaved = await this.checkIfPhotoIsAlreadySaved(
      photoId,
      saverId
    );
    if (isPhotoSaved) throw new Error("The photo is already saved!");
    const wasContentSaved = await this.addSavingToTheTable(photoId, saverId);
    if (!wasContentSaved) throw new Error("Saving wasn't added!");

    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async addSavingToTheTable(photoId: string, saverId: string) {
    const id = v4();
    const query = `
            INSERT INTO saved_content (id, contentId, saverId)
            VALUES (?, ?, ?)
        `;
    const params = [id, photoId, saverId];
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async checkIfPhotoIsAlreadySaved(photoId: string, saverId: string) {
    const query = `
            SELECT id, contentId, saverId
            FROM saved_content
            WHERE contentId = ? AND saverId = ?
        `;
    const params = [photoId, saverId];
    const [rows] = await this.connection.execute<IGetSavedContentQueryResult[]>(
      query,
      params
    );
    if (rows.length === 0) return false;
    return true;
  }

  async unsavePhoto(photoId: string, saverId: string) {
    const query = `
            UPDATE posts
            SET savings = savings - 1
            WHERE id = ?
        `;
    const params = [photoId];

    const isPhotoSaved = await this.checkIfPhotoIsAlreadySaved(
      photoId,
      saverId
    );
    if (!isPhotoSaved) throw new Error("The photo is NOT saved!");
    const wasSavingDeleted = await this.deleteSavingFromTheTable(
      photoId,
      saverId
    );
    if (!wasSavingDeleted) throw new Error("Saving was NOT deleted!");

    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async deleteSavingFromTheTable(photoId: string, saverId: string) {
    const query = `
            DELETE FROM saved_content
            WHERE contentId = ? AND saverId = ?
        `;
    const params = [photoId, saverId];
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async getAllUserSavedContent(saverId: string) {
    const query = `
            SELECT  id, contentId, saverId
            FROM saved_content
            WHERE saverId = ?
        `;
    const params = [saverId];
    const [rows] = await this.connection.execute<IGetSavedContentQueryResult[]>(
      query,
      params
    );
    if (rows.length === 0) {
      throw new Error("User has NO saved content!");
    }

    const savedContent = rows.map(
      (content) =>
        new SavedContentEntity(content.id, content.contentId, content.saverId)
    );
    return savedContent;
  }

  async likePhoto(photoId: string, userId: string) {
    const query = `
            UPDATE posts
            SET likes = likes + 1
            WHERE id = ?
        `;
    const params = [photoId];

    const doesLikeExist = await this.checkUserLike(photoId, userId);
    if (!doesLikeExist) throw new Error("You can NOT like one photo twice!");
    const wasLikeAdded = await this.addLikeToLikes(photoId, userId);
    if (!wasLikeAdded) throw new Error("Like was NOT added!");

    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async addLikeToLikes(photoId: string, userId: string) {
    const id = v4();
    const todayDate = new Date();

    const query = `
            INSERT INTO likes (id, contentId, likedBy, date) 
            VALUES (?, ?, ?, ?)
        `;
    const params = [id, photoId, userId, todayDate];
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async checkUserLike(photoId: string, userId: string) {
    const query = `
            SELECT id, contentId, likedBy FROM likes
            WHERE contentId = ? AND likedBy = ?
        `;
    const params = [photoId, userId];
    const [rows] = await this.connection.execute<IGetLikesQueryResult[]>(
      query,
      params
    );
    if (rows.length != 0) return false;
    return true;
  }

  async unlikePhoto(photoId: string, userId: string) {
    const query = `
            UPDATE posts
            SET likes = likes - 1
            WHERE id = ?
        `;
    const params = [photoId];

    const wasLikeDeleted = await this.deleteLikeFromLikes(photoId, userId);
    if (!wasLikeDeleted) throw new Error("Like was NOT deleted!");

    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async deleteLikeFromLikes(photoId: string, userId: string) {
    const query = `
            DELETE FROM likes
            WHERE contentId = ? AND likedBy = ?
        `;
    const params = [photoId, userId];
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async getAllPhotoLikes(photoId: string) {
    const query = `
            SELECT id, contentId, likedBy
            FROM likes
            WHERE contentId = ?
        `;
    const params = [photoId];
    const [rows] = await this.connection.execute<IGetLikesQueryResult[]>(
      query,
      params
    );
    if (rows.length === 0) {
      throw new Error("Photo has NO likes!");
    }

    const likes = rows.map(
      (like) => new PhotoLikeEntity(like.id, like.contentId, like.likedBy)
    );
    return likes;
  }

  async markUserOnThePhoto(
    photoId: string,
    userId: string,
    markedUser: string
  ) {
    const query = `
            UPDATE posts 
            SET markedUsers = true
            WHERE id = ? AND userId = ?
        `;
    const params = [photoId, userId];

    const isUserMarked = await this.checkIfUserIsAlreadyMarked(
      markedUser,
      photoId
    );
    if (isUserMarked) throw new Error("The user is already marked!");
    const wasMarkedUserAdded = await this.addMarkedUser(photoId, markedUser);
    if (!wasMarkedUserAdded) throw new Error("Marked user was NOT added!");

    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async addMarkedUser(photoId: string, markedUser: string) {
    const query = `
            INSERT INTO marked_users (userId, contentId) 
            VALUES (?, ?)
        `;
    const params = [markedUser, photoId];
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async getUsersMarkedInPhoto(photoId: string) {
    const query = `
            SELECT userId FROM marked_users
            WHERE contentId = ?
        `;
    const params = [photoId];
    const [rows] = await this.connection.execute<IGetMarkedUsersQueryResult[]>(
      query,
      params
    );
    if (rows.length === 0) {
      throw new Error("The photo has NO marked users!");
    }

    const markedUsers = rows.map(
      (markedUser) => new MarkedUsersEntity(markedUser.userId)
    );
    return markedUsers;
  }

  async checkIfUserIsAlreadyMarked(markedUser: string, photoId: string) {
    const query = `
            SELECT userId, contentId 
            FROM marked_users
            WHERE userId = ? AND contentId = ?
        `;
    const params = [markedUser, photoId];
    const [rows] = await this.connection.execute<IGetMarkedUsersQueryResult[]>(
      query,
      params
    );
    if (rows.length === 0) return false;
    return true;
  }

  async deleteMarkedUserOnThePhoto(photoId: string, markedUser: string) {
    const query = `
            DELETE FROM marked_users
            WHERE contentId = ? AND userId = ?
        `;
    const params = [photoId, markedUser];
    const isUserMarked = await this.checkIfUserIsAlreadyMarked(
      markedUser,
      photoId
    );
    if (!isUserMarked) throw new Error("The user was NOT marked!");
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async checkIfThereIsMarkedUserOnThePhoto(photoId: string) {
    const query = `
            SELECT * FROM marked_users
            WHERE contentId = ?
        `;
    const params = [photoId];
    const [rows] = await this.connection.execute<IGetMarkedUsersQueryResult[]>(
      query,
      params
    );
    return rows;
  }

  async setMarkedUsersFalse(photoId: string, userId: string) {
    const query = `
            UPDATE posts
            SET markedUsers = false
            WHERE id = ? AND userId = ?
        `;
    const params = [photoId, userId];
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  async deletePhoto(photoId: string, userId: string) {
    const query = `
            DELETE FROM posts
            WHERE id = ? AND userId = ?
        `;
    const params = [photoId, userId];
    const [rows] = await this.connection.execute(query, params);
    const resultSetHeader = rows as ResultSetHeader;
    if (resultSetHeader.affectedRows === 0) return false;
    return true;
  }

  //all photos of all users(unarchived)
  async getAllPhotos() {
    const query = `
            SELECT id, type, userId, description, likes, markedUsers, archived, views, sharings, savings, dateOfPublishing
            FROM posts
            WHERE archived = false
        `;
    const [rows] = await this.connection.execute<IGetPhotoQueryResult[]>(query);
    if (rows.length === 0) throw new Error("There are NO photos!");

    const photos = rows.map(
      (photo) =>
        new UserPhotoEntity(
          photo.id,
          photo.type,
          photo.userId,
          photo.description,
          photo.likes,
          photo.markedUsers,
          photo.archived,
          photo.views,
          photo.sharings,
          photo.savings,
          photo.dateOfPublishing
        )
    );
    return photos;
  }

  async getAllUserArchivedPhotos(userId: string) {
    const query = `
            SELECT id, type, userId, description, likes, markedUsers, archived, views, sharings, savings, dateOfPublishing 
            FROM posts
            WHERE userId = ? AND archived = true
        `;
    const params = [userId];
    const [rows] = await this.connection.execute<IGetPhotoQueryResult[]>(
      query,
      params
    );
    if (rows.length === 0) throw new Error("There are NO photos!");

    const photos = rows.map(
      (photo) =>
        new UserPhotoEntity(
          photo.id,
          photo.type,
          photo.userId,
          photo.description,
          photo.likes,
          photo.markedUsers,
          photo.archived,
          photo.views,
          photo.sharings,
          photo.savings,
          photo.dateOfPublishing
        )
    );
    return photos;
  }

  async getAllUserUnarchivedPhotos(userId: string) {
    const query = `
        SELECT id, type, userId, description, likes, markedUsers, archived, views, sharings, savings, dateOfPublishing 
        FROM posts
        WHERE userId = ? AND archived = false
    `;
    const params = [userId];
    const [rows] = await this.connection.execute<IGetPhotoQueryResult[]>(
      query,
      params
    );
    if (rows.length === 0) throw new Error("There are NO photos!");

    const photos = rows.map(
      (photo) =>
        new UserPhotoEntity(
          photo.id,
          photo.type,
          photo.userId,
          photo.description,
          photo.likes,
          photo.markedUsers,
          photo.archived,
          photo.views,
          photo.sharings,
          photo.savings,
          photo.dateOfPublishing
        )
    );
    return photos;
  }

  async getPhotoSavingsAmount(photoId: string, userId: string) {
    const query = `
        SELECT savings
        FROM posts
        WHERE id = ? AND userId = ?
    `;
    const params = [photoId, userId];

    const [rows] = await this.connection.execute<IGetSavingsQueryResult[]>(
      query,
      params
    );
    if (rows.length === 0) throw new Error("There are NO photos!");

    const savingsAmount = rows[0]?.savings;
    return savingsAmount;
  }

  // async getPhotoSharingsAmount(photoId: string, userId: string) {
  //     const query = `
  //         SELECT sharings
  //         FROM posts
  //         WHERE id = ? AND userId = ?
  //     `
  //     const params = [photoId, userId]

  //     const [rows] = await this.connection.execute<IGetSharingsQueryResult[]>(query, params)
  //     if (rows.length === 0) throw new Error("There are NO photos!")

  //     const sharingsAmount = rows[0]?.sharings
  //     return sharingsAmount
  // }
}
