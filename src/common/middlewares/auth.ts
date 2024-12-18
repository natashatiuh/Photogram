import { AuthRepository } from "../../auth/authRepository";
import { AuthService } from "../../auth/authService";
import { pool } from "../connection";
import { runInTransaction } from "./transaction";

export function auth() {
  return async (req: any, res: any, next: any) => {
    try {
      const token = req.headers.authorization;

      if (!token) throw new Error("Unauthorized!");

      await runInTransaction(async (connection) => {
        const authRepository = new AuthRepository(connection);
        const authService = new AuthService(authRepository);

        req.userId = await authService.verifyToken(token);
      });

      next();
    } catch (error) {
      console.log(error);
      res.send("Unauthorized!");
    }
  };
}
