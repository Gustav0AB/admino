import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { prisma } from "@lib/prisma";
import { requireAuth, requireRole, loadOrgContext } from "@middleware/auth";
import { AuthRequest, HttpError } from "@/types";
import { logAudit } from "@lib/audit";

const router = Router();
router.use(requireAuth, loadOrgContext);

// ── Schemas ────────────────────────────────────────────────────────────────

const updateBrandingSchema = z.object({
  name: z.string().min(1).optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  logoUrl: z.string().url().nullable().optional(),
});

const createMemberSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  email: z.string().email().optional(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  permissions: z.array(z.string()).default([]),
});

const updateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});

// ── Config (branding + features for the logged-in org) ────────────────────

router.get("/config", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user.orgId) throw new HttpError(403, "No client context");

    const client = await prisma.client.findUnique({
      where: { id: user.orgId },
      select: { id: true, name: true, slug: true, branding: true, clientPermissions: true, memberPermissions: true },
    });
    if (!client) throw new HttpError(404, "Client not found");

    const branding = client.branding as { primaryColor: string; secondaryColor: string; logoUrl: string | null };
    res.json({
      orgName: client.name,
      slug: client.slug,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      logoUrl: branding.logoUrl,
      clientPermissions: client.clientPermissions,
      memberPermissions: client.memberPermissions,
    });
  } catch (e) {
    next(e);
  }
});

// ── Branding ───────────────────────────────────────────────────────────────

router.patch(
  "/branding",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user.orgId) throw new HttpError(403, "No client context");
      const body = updateBrandingSchema.parse(req.body);

      const client = await prisma.client.findUnique({ where: { id: user.orgId } });
      if (!client) throw new HttpError(404, "Client not found");

      const { name, ...brandingFields } = body;
      const updated = await prisma.client.update({
        where: { id: user.orgId },
        data: {
          ...(name && { name }),
          branding: { ...(client.branding as object), ...brandingFields },
        },
        select: { id: true, name: true, slug: true, branding: true },
      });

      await logAudit(user, "client.branding.update", { targetId: user.orgId, targetType: "Client" });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

// ── Client Members (staff) ─────────────────────────────────────────────────

router.get("/members", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user.orgId) throw new HttpError(403, "No client context");

    const clientMembers = await prisma.clientMember.findMany({
      where: { clientId: user.orgId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(clientMembers);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/members",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user.orgId) throw new HttpError(403, "No client context");
      const body = createMemberSchema.parse(req.body);

      const client = await prisma.client.findUnique({ where: { id: user.orgId }, select: { slug: true } });
      if (!client) throw new HttpError(404, "Client not found");
      const prefixedUsername = `${client.slug}-${body.username}`;

      const existing = await prisma.clientMember.findFirst({
        where: { username: prefixedUsername, clientId: user.orgId },
      });
      if (existing) throw new HttpError(409, "A member with this username already exists");

      const hashed = await bcrypt.hash(body.password, 10);
      const clientMember = await prisma.clientMember.create({
        data: {
          name: body.name,
          username: prefixedUsername,
          email: body.email ?? null,
          password: hashed,
          role: body.role,
          permissions: body.permissions,
          clientId: user.orgId,
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          permissions: true,
          isActive: true,
          createdAt: true,
        },
      });

      await logAudit(user, "member.create", {
        targetId: clientMember.id,
        targetType: "ClientMember",
        metadata: { username: body.username, role: body.role },
      });
      res.status(201).json(clientMember);
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/members/:id",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as Record<string, string>;
      const user = (req as AuthRequest).user;
      if (!user.orgId) throw new HttpError(403, "No client context");
      const body = updateMemberSchema.parse(req.body);

      const clientMember = await prisma.clientMember.findFirst({
        where: { id, clientId: user.orgId },
      });
      if (!clientMember) throw new HttpError(404, "Member not found");
      if (clientMember.role === "OWNER" && user.role !== "OWNER") {
        throw new HttpError(403, "Only the owner can modify owner accounts");
      }

      const updated = await prisma.clientMember.update({
        where: { id },
        data: body,
        select: { id: true, name: true, username: true, email: true, role: true, permissions: true, isActive: true },
      });

      await logAudit(user, "member.update", {
        targetId: clientMember.id,
        targetType: "ClientMember",
        metadata: body as Record<string, unknown>,
      });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  "/members/:id",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as Record<string, string>;
      const user = (req as AuthRequest).user;
      if (!user.orgId) throw new HttpError(403, "No client context");

      const clientMember = await prisma.clientMember.findFirst({
        where: { id, clientId: user.orgId },
      });
      if (!clientMember) throw new HttpError(404, "Member not found");
      if (clientMember.role === "OWNER") throw new HttpError(403, "Cannot deactivate the client owner");

      await prisma.clientMember.update({ where: { id }, data: { isActive: false } });
      await logAudit(user, "member.deactivate", { targetId: clientMember.id, targetType: "ClientMember" });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
