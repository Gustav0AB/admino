import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { prisma } from "@lib/prisma";
import { env } from "@config/env";
import { requireAuth, requireRole } from "@middleware/auth";
import { AuthRequest, HttpError, JwtPayload } from "@/types";
import { logAudit } from "@lib/audit";

const router = Router();
router.use(requireAuth, requireRole("SYSTEM_ADMIN"));

// ── Schemas ────────────────────────────────────────────────────────────────

const createClientSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
  tipo: z.string().default("gym"),
  ownerPassword: z.string().min(8),
  ownerName: z.string().min(1),
  clientPermissions: z.array(z.string()).default([]),
  memberPermissions: z.array(z.string()).default([]),
});

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  tipo: z.string().optional(),
  clientPermissions: z.array(z.string()).optional(),
  memberPermissions: z.array(z.string()).optional(),
  branding: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      logoUrl: z.string().url().nullable().optional(),
    })
    .optional(),
});

const impersonateSchema = z.object({
  targetId: z.string(),
  targetType: z.enum(["ORG_MEMBER", "MEMBER"]),
});

// ── Clients ────────────────────────────────────────────────────────────────

router.get("/clients", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { clientMembers: true, members: true } } },
    });
    res.json(clients);
  } catch (e) {
    next(e);
  }
});

router.post("/clients", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    const { name, slug, tipo, ownerPassword, ownerName, clientPermissions, memberPermissions } = createClientSchema.parse(req.body);

    const existing = await prisma.client.findUnique({ where: { slug } });
    if (existing) throw new HttpError(409, "A client with this slug already exists");

    const hashed = await bcrypt.hash(ownerPassword, 10);

    const client = await prisma.$transaction(async (tx) => {
      const created = await tx.client.create({ data: { name, slug, tipo, clientPermissions, memberPermissions } });
      await tx.clientMember.create({
        data: {
          username: slug,
          password: hashed,
          name: ownerName,
          role: "OWNER",
          clientId: created.id,
        },
      });
      return created;
    });

    await logAudit(user, "client.create", {
      targetId: client.id,
      targetType: "Client",
      metadata: { name, slug },
    });
    const clientWithCount = await prisma.client.findUnique({
      where: { id: client.id },
      include: { _count: { select: { clientMembers: true, members: true } } },
    });
    res.status(201).json(clientWithCount);
  } catch (e) {
    next(e);
  }
});

router.get("/clients/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as Record<string, string>;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        clientMembers: {
          select: { id: true, name: true, username: true, role: true, isActive: true, permissions: true },
        },
        _count: { select: { clientMembers: true, members: true, plans: true } },
      },
    });
    if (!client) throw new HttpError(404, "Client not found");
    res.json(client);
  } catch (e) {
    next(e);
  }
});

router.patch("/clients/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as Record<string, string>;
    const user = (req as AuthRequest).user;
    const body = updateClientSchema.parse(req.body);

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) throw new HttpError(404, "Client not found");

    const updated = await prisma.client.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.tipo && { tipo: body.tipo }),
        ...(body.clientPermissions && { clientPermissions: body.clientPermissions }),
        ...(body.memberPermissions && { memberPermissions: body.memberPermissions }),
        ...(body.branding && { branding: { ...(client.branding as object), ...body.branding } }),
      },
    });

    await logAudit(user, "client.update", {
      targetId: client.id,
      targetType: "Client",
      metadata: body as Record<string, unknown>,
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete("/clients/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as Record<string, string>;
    const user = (req as AuthRequest).user;
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) throw new HttpError(404, "Client not found");

    await prisma.client.update({ where: { id }, data: { isActive: false } });
    await logAudit(user, "client.deactivate", { targetId: client.id, targetType: "Client" });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// ── Export ─────────────────────────────────────────────────────────────────

router.get("/clients/:id/export", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as Record<string, string>;
    const user = (req as AuthRequest).user;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        clientMembers: {
          select: { id: true, name: true, username: true, role: true, permissions: true, isActive: true, createdAt: true },
        },
        members: {
          select: { id: true, name: true, email: true, isActive: true, joinedAt: true },
        },
        plans: true,
      },
    });
    if (!client) throw new HttpError(404, "Client not found");

    await logAudit(user, "client.export", { targetId: client.id, targetType: "Client" });
    res.setHeader("Content-Disposition", `attachment; filename="${client.slug}-export.json"`);
    res.json(client);
  } catch (e) {
    next(e);
  }
});

// ── Audit Logs ─────────────────────────────────────────────────────────────

router.get("/audit-logs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orgId, actorId, action, limit = "50", offset = "0" } = req.query as Record<string, string>;
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(orgId && { orgId }),
        ...(actorId && { actorId }),
        ...(action && { action: { contains: action } }),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(parseInt(limit), 200),
      skip: parseInt(offset),
    });
    res.json(logs);
  } catch (e) {
    next(e);
  }
});

// ── Impersonation ──────────────────────────────────────────────────────────

router.post("/impersonate", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = (req as AuthRequest).user;
    const { targetId, targetType } = impersonateSchema.parse(req.body);

    type UserRow = { id: string; username: string; name: string; role?: string; clientId?: string };
    let targetUser: UserRow | null = null;

    if (targetType === "ORG_MEMBER") {
      const cm = await prisma.clientMember.findUnique({
        where: { id: targetId },
        select: { id: true, username: true, name: true, role: true, clientId: true },
      });
      targetUser = cm;
    } else {
      const m = await prisma.member.findUnique({
        where: { id: targetId },
        select: { id: true, email: true, name: true, lastname: true, clientId: true },
      });
      targetUser = m ? { ...m, username: m.email, name: `${m.name} ${m.lastname}`.trim() } : null;
    }

    if (!targetUser) throw new HttpError(404, "Target user not found");

    const payload: JwtPayload = {
      sub: targetUser.id,
      username: targetUser.username,
      name: targetUser.name,
      role: targetType === "MEMBER" ? "MEMBER" : (targetUser.role ?? "MEMBER"),
      orgId: targetUser.clientId ?? null,
      impersonatedBy: actor.sub,
    };

    const token = jwt.sign(payload, env.jwt.secret, { expiresIn: "1h" } as jwt.SignOptions);

    await logAudit(actor, "user.impersonate", {
      targetId: targetUser.id,
      targetType,
      metadata: { targetUsername: targetUser.username },
    });

    res.json({ token, user: payload });
  } catch (e) {
    next(e);
  }
});

export default router;
