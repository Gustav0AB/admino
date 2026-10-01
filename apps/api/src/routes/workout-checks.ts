import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { requireAuth } from "@middleware/auth";
import { AuthRequest, HttpError } from "@/types";

const router = Router();
router.use(requireAuth);

const checkSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  itemIndex: z.number().int().min(0),
  completed: z.boolean(),
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberId = (req as AuthRequest).user.sub;
    const date = req.query.date as string | undefined;
    if (!date) throw new HttpError(400, "date query param required");
    const checks = await prisma.workoutCheck.findMany({ where: { memberId, date } });
    res.json({ data: checks });
  } catch (e) { next(e); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, itemIndex, completed } = checkSchema.parse(req.body);
    const memberId = (req as AuthRequest).user.sub;
    const check = await prisma.workoutCheck.upsert({
      where: { memberId_date_itemIndex: { memberId, date, itemIndex } },
      create: { memberId, date, itemIndex, completed },
      update: { completed },
    });
    res.json({ data: check });
  } catch (e) { next(e); }
});

export default router;
