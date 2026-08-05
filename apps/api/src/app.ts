import express from "express";
import cors from "cors";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";
import { env } from "@config/env";
import { requestLogger, errorLogger } from "@middleware/logger";
import { responseWrapper } from "@middleware/response";
import { errorHandler } from "@middleware/error";
import apiRoutes from "@routes/index";

export function createApp() {
  const app = express();

  // ── Security & parsing ───────────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (env.cors.allowedOrigins.includes("*") || env.cors.allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS: origin '${origin}' not allowed`));
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Observability ────────────────────────────────────────────────────────
  app.use(requestLogger);

  // ── Standard response envelope ───────────────────────────────────────────
  app.use(responseWrapper);

  // ── Routes ───────────────────────────────────────────────────────────────
  app.use("/api/v1", apiRoutes);

  // ── Health check ─────────────────────────────────────────────────────────
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/v1", (_req, res) => {
    res.status(404).json({ statusCode: 404, message: "Not Found", error: "Not Found", timestamp: new Date().toISOString(), path: _req.path });
  });

  const webDist = path.resolve(__dirname, "../../web/dist");
  const indexHtml = path.join(webDist, "index.html");
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(webDist));
    app.get("*", (_req, res) => res.sendFile(indexHtml));
  }

  // ── 404 ───────────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ statusCode: 404, message: "Not Found", error: "Not Found", timestamp: new Date().toISOString(), path: _req.path });
  });

  // ── Error logging & handling ─────────────────────────────────────────────
  app.use(errorLogger);
  app.use(errorHandler);

  return app;
}
