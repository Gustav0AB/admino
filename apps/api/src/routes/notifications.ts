import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { requireAuth, requireRole } from "@middleware/auth";
import { AuthRequest, HttpError } from "@/types";
import { emitToUser } from "@lib/socket";
import { logAudit } from "@lib/audit";

const router = Router();
router.use(requireAuth);

// ── Schemas ────────────────────────────────────────────────────────────────

const sendSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  recipientIds: z.array(z.string()).min(1),
  recipientType: z.enum(["ORG_MEMBER", "MEMBER"]),
  clientId: z.string().optional(),
});

// ── Current user's notifications ──────────────────────────────────────────

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    const notifications = await prisma.notification.findMany({
      where: { recipientId: user.sub },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(notifications);
  } catch (e) {
    next(e);
  }
});

// ── Send (admin/owner only) ────────────────────────────────────────────────

router.post(
  "/",
  requireRole("OWNER", "ADMIN", "SYSTEM_ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      const body = sendSchema.parse(req.body);

      const clientId = user.orgId ?? body.clientId;
      if (!clientId) throw new HttpError(400, "clientId is required");

      const notifications = await prisma.$transaction(
        body.recipientIds.map((recipientId) =>
          prisma.notification.create({
            data: {
              title: body.title,
              body: body.body,
              recipientId,
              recipientType: body.recipientType,
              clientId,
            },
          })
        )
      );

      notifications.forEach((n) => {
        emitToUser(n.recipientId, "notification:received", {
          id: n.id,
          title: n.title,
          body: n.body,
          createdAt: n.createdAt,
        });
      });

      await logAudit(user, "notification.send", {
        metadata: { recipientCount: body.recipientIds.length, title: body.title },
      });

      res.status(201).json(notifications);
    } catch (e) {
      next(e);
    }
  }
);

// ── Mark as read ──────────────────────────────────────────────────────────

router.patch("/read-all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    await prisma.notification.updateMany({
      where: { recipientId: user.sub, isRead: false },
      data: { isRead: true },
    });
    res.json({ updated: true });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/read", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as Record<string, string>;
    const user = (req as AuthRequest).user;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new HttpError(404, "Notification not found");
    if (notification.recipientId !== user.sub) throw new HttpError(403, "Forbidden");

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;
