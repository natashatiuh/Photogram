import { PhotosRepository } from "./photosRepository";

export class PhotosService {
    constructor(public photosRepository: PhotosRepository) {}

    async addPhoto(userId: string, description: string, photo?: string,) {
        const wasPhotoAdded = await this.photosRepository.addPhoto(userId, description, photo)
        const wasUserInfoUpdated = await this.photosRepository.updateUserInfo(userId)
        if (!wasUserInfoUpdated) return false
        return wasPhotoAdded
    }

    async getAllUserPhotos(userId: string) {
        const photos = await this.photosRepository.getAllUserPhotos(userId)
        return photos
    }
}