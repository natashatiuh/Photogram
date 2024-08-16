export class UserEntity {
    id: string
    email: string
    password: string
    userName: string
    fullName: string
    age: number
    avatar: string
    bio: string
    followers: string
    following: string

    constructor(id: string, email: string, password: string, userName: string, fullName: string, age: number, avatar: string, bio: string, followers: string, following: string) {
        this.id = id
        this.email = email
        this.password = password
        this.userName = userName
        this.fullName = fullName
        this.age = age
        this.avatar = avatar
        this.bio = bio
        this.followers = followers
        this.following = following
    }
}