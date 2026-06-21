import { createApp } from "./app.js";
import { getPool, closePool } from "./config/db.js";
import { env } from "./config/env.js";

const app = createApp();
getPool();

const server = app.listen(env.port, () => {
  console.log(`Backend listening on http://localhost:${env.port}`);
});

const shutdown = async () => {
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
