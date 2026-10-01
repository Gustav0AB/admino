import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { requireAuth, requireRole } from "@middleware/auth";
import { AuthRequest, HttpError } from "@/types";
import { logAudit } from "@lib/audit";

const router = Router();
router.use(requireAuth);

// ── Schemas ────────────────────────────────────────────────────────────────

const createPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  maxUsers: z.number().int().positive().optional(),
  features: z.record(z.boolean()).default({}),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
});

const updatePlanSchema = createPlanSchema.partial();

const assignSchema = z.object({
  memberId: z.string(),
  planId: z.string(),
});

// ── Plans CRUD ─────────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    const clientId = user.orgId ?? (req.query.clientId as string | undefined);
    if (!clientId) throw new HttpError(400, "clientId is required");

    const plans = await prisma.plan.findMany({
      where: { clientId },
      include: { _count: { select: { assignments: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(plans);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/",
  requireRole("OWNER", "ADMIN", "SYSTEM_ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user.orgId) throw new HttpError(403, "No client context");
      const body = createPlanSchema.parse(req.body);

      const plan = await prisma.plan.create({
        data: { ...body, clientId: user.orgId },
      });

      await logAudit(user, "plan.create", {
        targetId: plan.id,
        targetType: "Plan",
        metadata: { name: body.name },
      });
      res.status(201).json(plan);
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/:id",
  requireRole("OWNER", "ADMIN", "SYSTEM_ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as Record<string, string>;
      const user = (req as AuthRequest).user;
      const body = updatePlanSchema.parse(req.body);

      const plan = await prisma.plan.findUnique({ where: { id } });
      if (!plan) throw new HttpError(404, "Plan not found");
      if (user.orgId && plan.clientId !== user.orgId) throw new HttpError(403, "Forbidden");

      const updated = await prisma.plan.update({ where: { id }, data: body });
      await logAudit(user, "plan.update", {
        targetId: plan.id,
        targetType: "Plan",
        metadata: body as Record<string, unknown>,
      });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  "/:id",
  requireRole("OWNER", "ADMIN", "SYSTEM_ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as Record<string, string>;
      const user = (req as AuthRequest).user;
      const plan = await prisma.plan.findUnique({ where: { id } });
      if (!plan) throw new HttpError(404, "Plan not found");
      if (user.orgId && plan.clientId !== user.orgId) throw new HttpError(403, "Forbidden");

      await prisma.plan.update({ where: { id }, data: { status: "ARCHIVED" } });
      await logAudit(user, "plan.archive", { targetId: plan.id, targetType: "Plan" });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

// ── Assignments ────────────────────────────────────────────────────────────

router.post(
  "/assign",
  requireRole("OWNER", "ADMIN", "SYSTEM_ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      const { memberId, planId } = assignSchema.parse(req.body);

      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) throw new HttpError(404, "Plan not found");
      if (user.orgId && plan.clientId !== user.orgId) throw new HttpError(403, "Forbidden");

      const assignment = await prisma.planAssignment.upsert({
        where: { memberId_planId: { memberId, planId } },
        create: { memberId, planId },
        update: {},
      });

      await logAudit(user, "plan.assign", {
        targetId: memberId,
        targetType: "Member",
        metadata: { planId },
      });
      res.status(201).json(assignment);
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  "/assign/:memberId/:planId",
  requireRole("OWNER", "ADMIN", "SYSTEM_ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      const { memberId, planId } = req.params as Record<string, string>;

      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) throw new HttpError(404, "Plan not found");
      if (user.orgId && plan.clientId !== user.orgId) throw new HttpError(403, "Forbidden");

      const assignment = await prisma.planAssignment.findUnique({
        where: { memberId_planId: { memberId, planId } },
      });
      if (!assignment) throw new HttpError(404, "Assignment not found");

      await prisma.planAssignment.delete({ where: { memberId_planId: { memberId, planId } } });
      await logAudit(user, "plan.unassign", {
        targetId: memberId,
        targetType: "Member",
        metadata: { planId },
      });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
