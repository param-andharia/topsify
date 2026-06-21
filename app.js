import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import apiRoutes from "./routes/index.js";
import { env } from "./config/env.js";
import { createSessionMiddleware } from "./config/session.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFound.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(currentDir, "..");
const workspaceRoot = path.resolve(backendRoot, "..");
const frontendDistPath = path.join(workspaceRoot, "frontend", "dist");

export const createApp = () => {
  const app = express();
  const allowedOrigins = env.frontendOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length > 0) {
    app.use(
      cors({
        origin(origin, callback) {
          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }

          return callback(new Error("Origin not allowed by CORS"));
        },
        credentials: true,
      })
    );
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(createSessionMiddleware());

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });

  app.use("/api", apiRoutes);

  if (existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }

      return res.sendFile(path.join(frontendDistPath, "index.html"));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
