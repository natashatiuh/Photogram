export class UserEntity {
    userId?: string
    email?: string
    password?: string
    userName?: string
    fullName?: string
    age?: number
    avatar?: string

    constructor(userId?: string, email?: string, password?: string, userName?: string, fullName?: string, age?: number, avatar?: string) {
        this.userId = userId
        this.email = email
        this.password = password
        this.userName = userName
        this.fullName = fullName
        this.age = age
        this.avatar = avatar
    }
}