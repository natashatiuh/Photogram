import { AuthRepository } from "./authRepository";
import { SignUpUserInput } from "./inputs/signUpUserInput";

export class AuthService {
    constructor(private authRepository: AuthRepository) {}

    async signUpUser(input: SignUpUserInput) {
        const userId = await this.authRepository.signUpUser(input)
        const tokens = await this.authRepository.generateTokenS(userId)
        return tokens
    }

    async signInUser(email: string, password: string) {
        const userId = await this.authRepository.signInUser(email, password)
        const tokens = await this.authRepository.generateTokenS(userId)
        return tokens
    }

    async verifyToken(accessToken: string) {
        const userId = await this.authRepository.verifyToken(accessToken)
        return userId
    }

    async checkPassword(plainPassword: string, hashedPassword: string) {
        const match = await this.authRepository.checkPassword(plainPassword, hashedPassword)
        return match
    }

    async getAuthCredentials(userId: string) {
        const auth_credentials = await this.authRepository.getAuthCredentials(userId)
        return auth_credentials
    }

    async getUserInfo(userId: string) {
        const user = await this.authRepository.getUserInfo(userId)
        return user
    }

    async changeUserName(userId: string, newUserName: string) {
        const wasUserNameChanged = await this.authRepository.changeUserName(userId, newUserName)
        return wasUserNameChanged
    }

    async changeUserFullName(userId: string, newUserFullName: string) {
        const wasUserFullNameChanged = await this.authRepository.changeUserFullName(userId, newUserFullName)
        return wasUserFullNameChanged
    }

    async changeEmail(userId: string, newEmail: string) {
        const wasEmailChanged = await this.authRepository.changeEmail(userId, newEmail)
        return wasEmailChanged
    }

    async changePassword(userId: string, currectPassword: string, newPassword: string) {
        const wasPasswordChanged = await this.authRepository.changePassword(userId, currectPassword, newPassword)
        return wasPasswordChanged
    }

    async deleteUser(userId: string) {
        const wasUserDeleted = await this.authRepository.deleteUser(userId)
        return wasUserDeleted
    }

    async addAvatar(userId: string, avatar?: string) {
        const wasAvatarAdded = await this.authRepository.addAvatar(userId, avatar)
        return wasAvatarAdded
    }

    async deleteAvatar(userId: string) {
        const wasAvatarDeleted = await this.authRepository.deleteAvatar(userId)
        return wasAvatarDeleted
    }

    async addUserBio(userId: string, bio: string) {
        const wasBioAdded = await this.authRepository.addUserBio(userId, bio)
        return wasBioAdded
    }

    async deleteUserBio(userId: string) {
        const wasBioDeleted = await this.authRepository.deleteUserBio(userId)
        return wasBioDeleted
    }

    async followUser(followerId: string, followedId: string) {
        const wasFollowingOkay = await this.authRepository.followUser(followerId, followedId)
        return wasFollowingOkay
    }

    async unfollowUser(followerId: string, followedId: string) {
        const wasUnfollowingOkay = await this.authRepository.unfollowUser(followerId, followedId)
        return wasUnfollowingOkay
    }

}