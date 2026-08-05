import { RequestHandler, ErrorRequestHandler } from "express";

function timestamp() {
  return new Date().toISOString();
}

export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? "ERROR" : res.statusCode >= 400 ? "WARN" : "INFO";
    console.log(`[${timestamp()}] ${level} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
};

export const errorLogger: ErrorRequestHandler = (err, req, _res, next) => {
  console.error(`[${timestamp()}] ERROR ${req.method} ${req.originalUrl} — ${(err as Error).message}`);
  if (process.env.NODE_ENV === "development") {
    console.error((err as Error).stack);
  }
  next(err);
};
