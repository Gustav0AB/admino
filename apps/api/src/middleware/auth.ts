import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "@config/env";
import { prisma } from "@lib/prisma";
import { AuthRequest, HttpError, JwtPayload, OrgBranding } from "@/types";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new HttpError(401, "Missing or invalid authorization header"));
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;
    (req as AuthRequest).user = payload;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;
    if (!user) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }
    if (!roles.includes(user.role)) {
      next(new HttpError(403, "Forbidden: insufficient role"));
      return;
    }
    next();
  };
}

export function requireFeature(feature: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const user = (req as AuthRequest).user;
    if (!user) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }
    if (user.role === "SYSTEM_ADMIN") {
      next();
      return;
    }
    if (!user.orgId) {
      next(new HttpError(403, "No client context"));
      return;
    }

    try {
      const client = await prisma.client.findUnique({
        where: { id: user.orgId },
        select: { clientPermissions: true, memberPermissions: true },
      });
      const enabled = (user.role === "MEMBER" ? client?.memberPermissions : client?.clientPermissions) as
        | string[]
        | undefined;
      if (!enabled?.includes(feature)) {
        next(new HttpError(403, `Forbidden: feature "${feature}" not enabled for this client`));
        return;
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

export async function loadOrgContext(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const user = (req as AuthRequest).user;
  if (!user?.orgId) {
    next();
    return;
  }

  try {
    const org = await prisma.client.findUnique({
      where: { id: user.orgId },
      select: { id: true, name: true, slug: true, branding: true, isActive: true },
    });

    if (!org || !org.isActive) {
      next(new HttpError(403, "Client not found or inactive"));
      return;
    }

    (req as AuthRequest).org = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      branding: org.branding as OrgBranding,
    };

    next();
  } catch (e) {
    next(e);
  }
}
