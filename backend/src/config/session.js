import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { env } from "./env.js";
import { getPool } from "./db.js";

const PgStore = connectPgSimple(session);

export const createSessionMiddleware = () =>
  session({
    name: "topsify.sid",
    store: new PgStore({
      pool: getPool(),
      tableName: env.sessionTableName,
      createTableIfMissing: true,
    }),
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.nodeEnv === "production",
      maxAge: env.sessionMaxAgeMs,
    },
  });
