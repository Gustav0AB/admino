import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@lib/prisma";
import { requireAuth, requireRole } from "@middleware/auth";
import { AuthRequest, HttpError } from "@/types";

const router = Router();
router.use(requireAuth, requireRole("OWNER", "ADMIN", "SYSTEM_ADMIN"));

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    const { action, actorId, limit = "50", offset = "0" } = req.query as Record<string, string>;

    const orgId = user.orgId ?? (req.query.orgId as string | undefined);
    if (!orgId && user.role !== "SYSTEM_ADMIN") throw new HttpError(400, "orgId is required");

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(orgId && { orgId }),
        ...(action && { action: { contains: action } }),
        ...(actorId && { actorId }),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(parseInt(limit), 100),
      skip: parseInt(offset),
    });
    res.json(logs);
  } catch (e) {
    next(e);
  }
});

export default router;
