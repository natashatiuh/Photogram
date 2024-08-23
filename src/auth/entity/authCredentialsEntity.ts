export class AuthCredentialsEntity {
    userId: string
    email: string
    password: string

    constructor(userId: string, email: string, password: string) {
        this.userId = userId
        this.email = email
        this.password = password
    }
}