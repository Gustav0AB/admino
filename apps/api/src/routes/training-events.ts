import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { requireAuth, requireRole } from "@middleware/auth";
import { AuthRequest, HttpError } from "@/types";

const router = Router();
router.use(requireAuth);

const eventSchema = z.object({
  name: z.string().min(1),
  date: z.string(),
  type: z.enum(["competition", "seminar", "vacation"]),
  planId: z.string().optional().nullable(),
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = (req as AuthRequest).user.orgId;
    if (!clientId) throw new HttpError(403, "Forbidden");
    const events = await prisma.trainingEvent.findMany({
      where: { clientId },
      orderBy: { date: "asc" },
    });
    res.json({ data: events });
  } catch (e) { next(e); }
});

router.post("/", requireRole("OWNER", "ADMIN", "SYSTEM_ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = eventSchema.parse(req.body);
    const clientId = (req as AuthRequest).user.orgId;
    if (!clientId) throw new HttpError(403, "Forbidden");
    const event = await prisma.trainingEvent.create({
      data: { name: data.name, date: new Date(data.date), type: data.type, clientId, planId: data.planId ?? null },
    });
    res.status(201).json({ data: event });
  } catch (e) { next(e); }
});

router.delete("/:id", requireRole("OWNER", "ADMIN", "SYSTEM_ADMIN"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    const event = await prisma.trainingEvent.findUnique({ where: { id: req.params["id"] as string } });
    if (!event) throw new HttpError(404, "Event not found");
    if (user.orgId && event.clientId !== user.orgId) throw new HttpError(403, "Forbidden");
    await prisma.trainingEvent.delete({ where: { id: req.params["id"] as string } });
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
