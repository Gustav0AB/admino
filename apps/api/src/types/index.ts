import { Request } from "express";

// ── API response shapes ────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  data: T;
  statusCode: number;
  timestamp: string;
};

export type ApiError = {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
};

// ── Auth ───────────────────────────────────────────────────────────────────

export type JwtPayload = {
  sub: string;
  username: string;
  name?: string;
  role: string;
  orgId: string | null;
  impersonatedBy?: string;
};

export type OrgBranding = {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
};

export type OrgContext = {
  id: string;
  name: string;
  slug: string;
  branding: OrgBranding;
};

export interface AuthRequest extends Request {
  user: JwtPayload;
  org?: OrgContext;
}

// ── HTTP errors ────────────────────────────────────────────────────────────

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string | string[]
  ) {
    super(Array.isArray(message) ? message.join(", ") : message);
    this.name = "HttpError";
  }
}
