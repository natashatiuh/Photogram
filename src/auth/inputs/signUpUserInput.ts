export class SignUpUserInput {
    email: string
    password: string
    userName: string
    fullName: string
    age: number

    constructor(email: string, password: string, userName: string, fullName: string, age: number) {
        this.email = email
        this.password = password
        this.userName = userName
        this.fullName = fullName
        this.age = age
    }
}