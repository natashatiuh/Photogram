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

    async changePhotoDescription(photoId: string, newDescription: string, userId: string) {
        const wasDescriptionChanged = await this.photosRepository.changePhotoDescription(photoId, newDescription, userId)
        return wasDescriptionChanged
    }

    async archivePhoto(photoId: string, userId: string) {
        const wasPhotoArchived = await this.photosRepository.archivePhoto(photoId, userId)
        return wasPhotoArchived
    }
}
