import { Request, Response, NextFunction } from "express";
import { ApiSuccess } from "@/types";

/**
 * Wraps res.json() to automatically apply the standard success envelope:
 * { data, statusCode, timestamp }
 *
 * Routes just call res.json(payload) and this middleware handles the wrapping.
 */
export function responseWrapper(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalJson = res.json.bind(res);

  res.json = function <T>(body: T): Response {
    // Already wrapped or is an error response — pass through
    if (
      body !== null &&
      typeof body === "object" &&
      ("error" in (body as object) || "data" in (body as object))
    ) {
      return originalJson(body);
    }

    const wrapped: ApiSuccess<T> = {
      data: body,
      statusCode: res.statusCode,
      timestamp: new Date().toISOString(),
    };

    return originalJson(wrapped);
  };

  next();
}
