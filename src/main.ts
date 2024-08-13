import express from "express"
import corse from "cors"
import dotenv from "dotenv"
dotenv.config()

import { router as authController } from "../src/auth/authController"

async function main() {
    const app = express()
    const port = 4000

    app.use(express.json())
    app.use(corse())

    app.use("/auth", authController)

    app.listen(port, () => {
        console.log(`Server is listening on port ${port}`)
    })
}

main()
