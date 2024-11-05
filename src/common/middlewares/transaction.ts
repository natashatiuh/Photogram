import { PoolConnection } from "mysql2/promise";
import { pool } from "../connection";

export async function runInTransaction<T>(
  func: (connection: PoolConnection) => T
) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const output = await func(connection);
    await connection.commit();
    return output;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
