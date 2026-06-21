import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

let poolInstance;

const getPoolConfig = () => {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required before starting the backend.");
  }

  return {
    connectionString: env.databaseUrl,
    ssl: env.nodeEnv === "production" ? { rejectUnauthorized: false } : undefined,
  };
};

export const getPool = () => {
  if (!poolInstance) {
    poolInstance = new Pool(getPoolConfig());
  }

  return poolInstance;
};

export const query = (text, params) => getPool().query(text, params);

export const withTransaction = async (callback) => {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const closePool = async () => {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = undefined;
  }
};
