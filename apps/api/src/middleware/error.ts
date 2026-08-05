import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError, HttpError } from "@/types";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const timestamp = new Date().toISOString();
  const path = req.path;

  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    const body: ApiError = {
      statusCode: 422,
      message: messages,
      error: "Unprocessable Entity",
      timestamp,
      path,
    };
    res.status(422).json(body);
    return;
  }

  if (err instanceof HttpError) {
    const body: ApiError = {
      statusCode: err.statusCode,
      message: err.message,
      error: HTTP_STATUS_TEXT[err.statusCode] ?? "Error",
      timestamp,
      path,
    };
    res.status(err.statusCode).json(body);
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  const body: ApiError = {
    statusCode: 500,
    message: "Internal server error",
    error: "Internal Server Error",
    timestamp,
    path,
  };
  res.status(500).json(body);
}

const HTTP_STATUS_TEXT: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  500: "Internal Server Error",
};
