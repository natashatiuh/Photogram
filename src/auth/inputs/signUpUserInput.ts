export class SignUpUserInput {
    email: string
    password: string
    userName: string
    fullName: string
    dateOfBirth: Date

    constructor(email: string, password: string, userName: string, fullName: string, dateOfBirth: Date) {
        this.email = email
        this.password = password
        this.userName = userName
        this.fullName = fullName
        this.dateOfBirth = dateOfBirth
    }
}