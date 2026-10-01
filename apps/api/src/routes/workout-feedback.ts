import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { requireAuth } from "@middleware/auth";
import { AuthRequest, HttpError } from "@/types";

const router = Router();
router.use(requireAuth);

const feedbackSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rpe: z.number().int().min(1).max(10).optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberId = (req as AuthRequest).user.sub;
    const date = req.query.date as string | undefined;
    if (!date) throw new HttpError(400, "date query param required");
    const feedback = await prisma.workoutFeedback.findUnique({
      where: { memberId_date: { memberId, date } },
    });
    res.json({ data: feedback });
  } catch (e) { next(e); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, rpe, notes } = feedbackSchema.parse(req.body);
    const memberId = (req as AuthRequest).user.sub;
    const feedback = await prisma.workoutFeedback.upsert({
      where: { memberId_date: { memberId, date } },
      create: { memberId, date, rpe, notes },
      update: { rpe, notes },
    });
    res.json({ data: feedback });
  } catch (e) { next(e); }
});

export default router;
