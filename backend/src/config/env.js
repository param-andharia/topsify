import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(currentDir, "../..");
const workspaceRoot = path.resolve(backendRoot, "..");

dotenv.config({ path: path.join(workspaceRoot, ".env") });
dotenv.config({ path: path.join(backendRoot, ".env"), override: true });

const oneDayInMs = 1000 * 60 * 60 * 24;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number.parseInt(process.env.PORT ?? "3000", 10),
  databaseUrl: process.env.DATABASE_URL ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "development-session-secret",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  sessionTableName: process.env.SESSION_TABLE_NAME ?? "user_sessions",
  sessionMaxAgeMs: Number.parseInt(process.env.SESSION_MAX_AGE_MS ?? String(oneDayInMs), 10),
};
