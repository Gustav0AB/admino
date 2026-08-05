import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { requireAuth, requireFeature, requireRole } from "@middleware/auth";
import { AuthRequest, HttpError } from "@/types";

const router = Router();
router.use(requireAuth);

const planSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  cells: z.record(z.string()).optional(),
});

const assignSchema = z.object({
  memberId: z.string(),
  planId: z.string(),
});

router.get("/my-plan", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sub: memberId } = (req as AuthRequest).user;
    const assignment = await prisma.trainingPlanAssignment.findFirst({
      where: { memberId },
      orderBy: { assignedAt: "desc" },
      include: {
        plan: { include: { events: { orderBy: { date: "asc" } } } },
      },
    });
    res.json({ data: assignment?.plan ?? null });
  } catch (e) { next(e); }
});

router.get("/", requireRole("OWNER", "ADMIN", "SYSTEM_ADMIN"), requireFeature("athlete_dashboard"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = (req as AuthRequest).user.orgId;
    if (!clientId) throw new HttpError(403, "Forbidden");
    const plans = await prisma.trainingPlan.findMany({
      where: { clientId },
      include: { _count: { select: { assignments: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: plans });
  } catch (e) { next(e); }
});

router.post("/", requireRole("OWNER", "ADMIN", "SYSTEM_ADMIN"), requireFeature("athlete_dashboard"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = planSchema.parse(req.body);
    const clientId = (req as AuthRequest).user.orgId;
    if (!clientId) throw new HttpError(403, "Forbidden");
    const plan = await prisma.trainingPlan.create({
      data: {
        name: data.name,
        clientId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        cells: (data.cells ?? {}) as object,
      },
    });
    res.status(201).json({ data: plan });
  } catch (e) { next(e); }
});

router.patch("/:id", requireRole("OWNER", "ADMIN", "SYSTEM_ADMIN"), requireFeature("athlete_dashboard"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = planSchema.partial().parse(req.body);
    const user = (req as AuthRequest).user;
    const plan = await prisma.trainingPlan.findUnique({ where: { id: req.params["id"] as string } });
    if (!plan) throw new HttpError(404, "Plan not found");
    if (user.orgId && plan.clientId !== user.orgId) throw new HttpError(403, "Forbidden");
    const updated = await prisma.trainingPlan.update({
      where: { id: req.params["id"] as string },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.cells !== undefined && { cells: data.cells as object }),
      },
    });
    res.json({ data: updated });
  } catch (e) { next(e); }
});

router.delete("/:id", requireRole("OWNER", "ADMIN", "SYSTEM_ADMIN"), requireFeature("athlete_dashboard"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    const plan = await prisma.trainingPlan.findUnique({ where: { id: req.params["id"] as string } });
    if (!plan) throw new HttpError(404, "Plan not found");
    if (user.orgId && plan.clientId !== user.orgId) throw new HttpError(403, "Forbidden");
    await prisma.trainingPlan.delete({ where: { id: req.params["id"] as string } });
    res.status(204).send();
  } catch (e) { next(e); }
});

router.post("/assign", requireRole("OWNER", "ADMIN", "SYSTEM_ADMIN"), requireFeature("athlete_dashboard"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, planId } = assignSchema.parse(req.body);
    const user = (req as AuthRequest).user;
    const plan = await prisma.trainingPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new HttpError(404, "Plan not found");
    if (user.orgId && plan.clientId !== user.orgId) throw new HttpError(403, "Forbidden");
    const assignment = await prisma.trainingPlanAssignment.upsert({
      where: { memberId_planId: { memberId, planId } },
      create: { memberId, planId },
      update: { assignedAt: new Date() },
    });
    res.status(201).json({ data: assignment });
  } catch (e) { next(e); }
});

router.delete("/assign/:memberId/:planId", requireRole("OWNER", "ADMIN", "SYSTEM_ADMIN"), requireFeature("athlete_dashboard"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    const planId = req.params["planId"] as string;
    const plan = await prisma.trainingPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new HttpError(404, "Plan not found");
    if (user.orgId && plan.clientId !== user.orgId) throw new HttpError(403, "Forbidden");
    await prisma.trainingPlanAssignment.deleteMany({
      where: { memberId: req.params["memberId"] as string, planId },
    });
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
