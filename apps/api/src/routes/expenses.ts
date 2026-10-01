import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { requireAuth, requireFeature } from "@middleware/auth";
import { AuthRequest, HttpError } from "@/types";

const router = Router();

router.use(requireAuth, requireFeature("finanzas"));

// Personal finance blob — loose shape on purpose (see AppData in the frontend),
// just guards against non-object payloads and abuse-sized bodies.
const MAX_BODY_BYTES = 500_000;
const expensesBodySchema = z.record(z.string(), z.unknown());

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user.sub;
    const record = await prisma.userExpenses.findUnique({ where: { userId } });
    res.json(record ? record.data : {});
  } catch (e) {
    next(e);
  }
});

router.put("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = expensesBodySchema.parse(req.body);
    if (JSON.stringify(body).length > MAX_BODY_BYTES) {
      throw new HttpError(413, "Payload too large");
    }
    const userId = (req as AuthRequest).user.sub;
    const { savedAt: _ignored, ...rest } = body;

    const data = { ...rest, savedAt: new Date().toISOString() };

    const record = await prisma.userExpenses.upsert({
      where: { userId },
      create: { userId, data },
      update: { data },
    });

    res.json(record.data);
  } catch (e) {
    next(e);
  }
});

export default router;
