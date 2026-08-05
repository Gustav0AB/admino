import { prisma } from "@lib/prisma";
import { JwtPayload } from "@/types";

type ActorType = "SYSTEM_ADMIN" | "ORG_MEMBER" | "MEMBER";

function resolveActorType(role: string): ActorType {
  if (role === "SYSTEM_ADMIN") return "SYSTEM_ADMIN";
  if (role === "MEMBER") return "MEMBER";
  return "ORG_MEMBER";
}

export async function logAudit(
  user: JwtPayload,
  action: string,
  opts: { targetId?: string; targetType?: string; metadata?: Record<string, unknown> } = {}
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: user.sub,
        actorType: resolveActorType(user.role),
        action,
        targetId: opts.targetId ?? null,
        targetType: opts.targetType ?? null,
        metadata: (opts.metadata ?? {}) as object,
        orgId: user.orgId,
      },
    });
  } catch {
    // audit log failure must never break the request
  }
}
