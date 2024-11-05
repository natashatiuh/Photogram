import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { router as authController } from "../src/auth/authController";
import { router as usersController } from "../src/users/usersController";
import { router as photosController } from "../src/photos/photosController";

async function main() {
  const app = express();
  const port = 4000;

  app.use(express.json());
  app.use(
    cors({
      origin: "http://localhost:3000",
    })
  );

  app.use("/auth", authController);
  app.use("/users", usersController);
  app.use("/photos", photosController);
  app.use("/images", express.static("./images"));

  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
}

main();
