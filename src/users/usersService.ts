import { UsersRepository } from "./usersRepository"

export class UsersService {
    constructor(private usersRepository: UsersRepository) {}

    async getUserInfo(userId: string) {
        const user = await this.usersRepository.getUserInfo(userId)
        return user
    }

    async changeUserName(userId: string, newUserName: string) {
        const wasUserNameChanged = await this.usersRepository.changeUserName(userId, newUserName)
        return wasUserNameChanged
    }

    async changeUserFullName(userId: string, newUserFullName: string) {
        const wasUserFullNameChanged = await this.usersRepository.changeUserFullName(userId, newUserFullName)
        return wasUserFullNameChanged
    }

    async changeDateOfBirth(userId: string, newDate: Date) {
        const wasBirthDateChanged = await this.usersRepository.changeDateOfBirth(userId, newDate)
        return wasBirthDateChanged
    }

    async addAvatar(userId: string, avatar?: string) {
        const wasAvatarAdded = await this.usersRepository.addAvatar(userId, avatar)
        return wasAvatarAdded
    }

    async deleteAvatar(userId: string) {
        const wasAvatarDeleted = await this.usersRepository.deleteAvatar(userId)
        return wasAvatarDeleted
    }

    async addUserBio(userId: string, bio: string) {
        const wasBioAdded = await this.usersRepository.addUserBio(userId, bio)
        return wasBioAdded
    }

    async deleteUserBio(userId: string) {
        const wasBioDeleted = await this.usersRepository.deleteUserBio(userId)
        return wasBioDeleted
    }

    async followUser(followerId: string, followedId: string) {
        const wasFollowingOkay = await this.usersRepository.followUser(followerId, followedId)
        return wasFollowingOkay
    }

    async unfollowUser(followerId: string, followedId: string) {
        const wasUnfollowingOkay = await this.usersRepository.unfollowUser(followerId, followedId)
        return wasUnfollowingOkay
    }

    async getAllUsersInfo() {
        const users = await this.usersRepository.getAllUsersInfo()
        return users
    }

    async getAllUserFollowers(followedId: string) {
        const followers = await this.usersRepository.getAllUserFollowers(followedId)
        return followers
    }

    async getAllUserFollowings(followerId: string) {
        const followings = await this.usersRepository.getAllUserFollowings(followerId)
        return followings
    }
}