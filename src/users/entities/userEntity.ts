export class UserEntity {
    id: string
    userName: string
    fullName: string
    dateOfBirth: Date
    avatar: string
    bio: string
    followers: string
    followings: string
    posts: number

    constructor(id: string, userName: string, fullName: string, dateOfBirth: Date, avatar: string, bio: string, followers: string, followings: string, posts: number) {
        this.id = id
        this.userName = userName
        this.fullName = fullName
        this.dateOfBirth = dateOfBirth
        this.avatar = avatar
        this.bio = bio
        this.followers = followers
        this.followings = followings
        this.posts = posts
    }
}