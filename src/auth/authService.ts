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

    async getUser(userId: string) {
        const user = await this.authRepository.getUser(userId)
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

    async deleteUser(userId: string) {
        const wasUserDeleted = await this.authRepository.deleteUser(userId)
        return wasUserDeleted
    }
}