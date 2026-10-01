import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { requireAuth, requireRole } from "@middleware/auth";
import { AuthRequest, HttpError } from "@/types";
import { logAudit } from "@lib/audit";

const router = Router();
router.use(requireAuth);

// ── Schemas ────────────────────────────────────────────────────────────────

const createRoleSchema = z.object({
  name: z.string().min(1),
  permissions: z.array(z.string()).default([]),
});

const updateRoleSchema = createRoleSchema.partial();

// ── Roles CRUD ─────────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    if (!user.orgId) throw new HttpError(403, "No client context");

    const roles = await prisma.memberRole.findMany({
      where: { clientId: user.orgId },
      include: { _count: { select: { assignments: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(roles);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user.orgId) throw new HttpError(403, "No client context");
      const body = createRoleSchema.parse(req.body);

      const role = await prisma.memberRole.create({
        data: { ...body, clientId: user.orgId },
      });

      await logAudit(user, "memberRole.create", {
        targetId: role.id,
        targetType: "MemberRole",
        metadata: { name: body.name },
      });
      res.status(201).json(role);
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as Record<string, string>;
      const user = (req as AuthRequest).user;
      const body = updateRoleSchema.parse(req.body);

      const role = await prisma.memberRole.findFirst({
        where: { id, clientId: user.orgId ?? undefined },
      });
      if (!role) throw new HttpError(404, "Role not found");

      const updated = await prisma.memberRole.update({ where: { id }, data: body });
      await logAudit(user, "memberRole.update", { targetId: role.id, targetType: "MemberRole" });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  "/:id",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as Record<string, string>;
      const user = (req as AuthRequest).user;
      const role = await prisma.memberRole.findFirst({
        where: { id, clientId: user.orgId ?? undefined },
      });
      if (!role) throw new HttpError(404, "Role not found");

      await prisma.memberRole.delete({ where: { id } });
      await logAudit(user, "memberRole.delete", { targetId: role.id, targetType: "MemberRole" });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

// ── Member assignments ─────────────────────────────────────────────────────

router.post(
  "/:id/members",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as Record<string, string>;
      const user = (req as AuthRequest).user;
      const { memberId } = z.object({ memberId: z.string() }).parse(req.body);

      const role = await prisma.memberRole.findFirst({
        where: { id, clientId: user.orgId ?? undefined },
      });
      if (!role) throw new HttpError(404, "Role not found");

      const assignment = await prisma.memberRoleAssignment.upsert({
        where: { memberId_roleId: { memberId, roleId: role.id } },
        create: { memberId, roleId: role.id },
        update: {},
      });

      await logAudit(user, "memberRole.assign", {
        targetId: memberId,
        targetType: "Member",
        metadata: { roleId: role.id, roleName: role.name },
      });
      res.status(201).json(assignment);
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  "/:id/members/:memberId",
  requireRole("OWNER", "ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      const { id: roleId, memberId } = req.params as Record<string, string>;

      const assignment = await prisma.memberRoleAssignment.findUnique({
        where: { memberId_roleId: { memberId, roleId } },
      });
      if (!assignment) throw new HttpError(404, "Assignment not found");

      await prisma.memberRoleAssignment.delete({ where: { memberId_roleId: { memberId, roleId } } });
      await logAudit(user, "memberRole.unassign", {
        targetId: memberId,
        targetType: "Member",
        metadata: { roleId },
      });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
