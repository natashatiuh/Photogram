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

    async savePhoto(photoId: string, saverId: string) {
        const wasPhotoSaved = await this.photosRepository.savePhoto(photoId, saverId)
        return wasPhotoSaved
    }

    async unsavePhoto(photoId: string, saverId: string) {
        const wasPhotoUnsaved = await this.photosRepository.unsavePhoto(photoId, saverId)
        return wasPhotoUnsaved
    }

    async getAllUserSavedContent(saverId: string) {
        const savedContent = await this.photosRepository.getAllUserSavedContent(saverId)
        return savedContent
    }

    async likePhoto(photoId: string, userId: string) {
        const wasLikeAdded = await this.photosRepository.likePhoto(photoId, userId)
        return wasLikeAdded
    }

    async getAllPhotoLikes(photoId: string) {
        const likes = await this.photosRepository.getAllPhotoLikes(photoId)
        return likes
    }

    async unlikePhoto(photoId: string, userId: string) {
        const wasLikeDeleted = await this.photosRepository.unlikePhoto(photoId, userId)
        return wasLikeDeleted
    }

    async markUserOnThePhoto(photoId: string, userId: string, markedUser: string) {
        const wasUserMarked = await this.photosRepository.markUserOnThePhoto(photoId, userId, markedUser)
        return wasUserMarked
    }

    async getUsersMarkedInPhoto(photoId: string) {
        const markedUsers = await this.photosRepository.getUsersMarkedInPhoto(photoId)
        return markedUsers
    }

    async deleteMarkedUserOnThePhoto(photoId: string, userId: string, markedUser: string) {
        const wasUserDeleted = await this.photosRepository.deleteMarkedUserOnThePhoto(photoId, markedUser)
        const isThereAnyMarkedUsersOnThePhoto = await this.photosRepository.checkIfThereIsMarkedUserOnThePhoto(photoId)
        if (isThereAnyMarkedUsersOnThePhoto.length === 0) {
            await this.photosRepository.setMarkedUsersFalse(photoId, userId)
        } 

        return wasUserDeleted
    }

    async deletePhoto(photoId: string, userId: string) {
        const wasPhotoDeleted = this.photosRepository.deletePhoto(photoId, userId)
        return wasPhotoDeleted
    }

    async getAllPhotos() {
        const photos = await this.photosRepository.getAllPhotos()
        return photos
    }

    async getAllUserArchivedPhotos(userId: string) {
        const photos = await this.photosRepository.getAllUserArchivedPhotos(userId)
        return photos
    }
}
