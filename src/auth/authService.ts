import { AuthRepository } from "./authRepository";
import { SignUpUserInput } from "./inputs/signUpUserInput";

export class AuthService {
  constructor(private authRepository: AuthRepository) {}

  async signUpUser(input: SignUpUserInput) {
    const userId = await this.authRepository.signUpUser(input);
    const tokens = await this.authRepository.generateTokenS(userId);
    return tokens;
  }

  async signInUser(email: string, password: string) {
    const userId = await this.authRepository.signInUser(email, password);
    const tokens = await this.authRepository.generateTokenS(userId);
    console.log(email);
    console.log(password);
    console.log(tokens);
    return tokens;
  }

  async verifyToken(accessToken: string) {
    const userId = await this.authRepository.verifyToken(accessToken);
    return userId;
  }

  async checkPassword(plainPassword: string, hashedPassword: string) {
    const match = await this.authRepository.checkPassword(
      plainPassword,
      hashedPassword
    );
    return match;
  }

  async getAuthCredentials(userId: string) {
    const auth_credentials = await this.authRepository.getAuthCredentials(
      userId
    );
    return auth_credentials;
  }

  async changeEmail(userId: string, newEmail: string) {
    const wasEmailChanged = await this.authRepository.changeEmail(
      userId,
      newEmail
    );
    return wasEmailChanged;
  }

  async changePassword(
    userId: string,
    currectPassword: string,
    newPassword: string
  ) {
    const wasPasswordChanged = await this.authRepository.changePassword(
      userId,
      currectPassword,
      newPassword
    );
    return wasPasswordChanged;
  }

  async deleteUser(userId: string) {
    const wasUserDeleted = await this.authRepository.deleteUser(userId);
    return wasUserDeleted;
  }
}
