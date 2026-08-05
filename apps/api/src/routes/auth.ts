import { Router, Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import { z } from "zod";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { prisma } from "@lib/prisma";
import { env } from "@config/env";
import { sendPasswordResetEmail } from "@lib/mailer";
import { HttpError, JwtPayload, AuthRequest } from "@/types";
import { requireAuth } from "@middleware/auth";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const forgotPasswordSchema = z.object({
  username: z.string().min(1),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

/**
 * POST /auth/login
 * Resolves user across SystemAdmin → OrgMember → Client, verifies password,
 * and returns a signed JWT with { sub, email, role, orgId }.
 */
router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      const systemAdmin = await prisma.systemAdmin.findUnique({ where: { email: username } });
      const clientMember = !systemAdmin ? await prisma.clientMember.findFirst({ where: { username } }) : null;
      const member = !systemAdmin && !clientMember
        ? await prisma.member.findFirst({ where: { OR: [{ email: username }, { username }] } })
        : null;

      const user = systemAdmin ?? clientMember ?? member;
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new HttpError(401, "Invalid credentials");
      }

      const name = systemAdmin
        ? systemAdmin.name
        : clientMember
        ? clientMember.name
        : `${member!.name} ${member!.lastname}`.trim();

      const payload: JwtPayload = {
        sub: user.id,
        username: clientMember ? clientMember.username : (user as { email: string }).email,
        name,
        role: systemAdmin ? "SYSTEM_ADMIN" : clientMember ? String(clientMember.role) : "MEMBER",
        orgId: "clientId" in user ? user.clientId : null,
      };

      const token = jwt.sign(payload, env.jwt.secret, {
        expiresIn: env.jwt.expiresIn,
      } as jwt.SignOptions);

      const { exp } = jwt.decode(token) as { exp: number };
      res.json({ token, user: payload, expiresAt: exp });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * PATCH /auth/change-password
 * Allows authenticated users to change their own password.
 */
router.patch(
  "/change-password",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      const { sub, role } = (req as AuthRequest).user!;

      let user: { password: string } | null = null;
      let updateFn: (hash: string) => Promise<unknown>;

      if (role === "SYSTEM_ADMIN") {
        user = await prisma.systemAdmin.findUnique({ where: { id: sub } });
        updateFn = (hash) => prisma.systemAdmin.update({ where: { id: sub }, data: { password: hash } });
      } else if (role === "OWNER" || role === "ADMIN" || role === "CLIENT") {
        user = await prisma.clientMember.findUnique({ where: { id: sub } });
        updateFn = (hash) => prisma.clientMember.update({ where: { id: sub }, data: { password: hash } });
      } else {
        user = await prisma.member.findUnique({ where: { id: sub } });
        updateFn = (hash) => prisma.member.update({ where: { id: sub }, data: { password: hash } });
      }

      if (!user) throw new HttpError(404, "User not found");
      if (!(await bcrypt.compare(currentPassword, user.password))) {
        throw new HttpError(400, "Current password is incorrect");
      }

      const hash = await bcrypt.hash(newPassword, 10);
      await updateFn(hash);

      res.json({ message: "Password updated successfully" });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * POST /auth/forgot-password
 * Resolves the username across the 3 login tables and emails a reset link.
 * Always responds with the same generic message to avoid user enumeration.
 */
router.post(
  "/forgot-password",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username } = forgotPasswordSchema.parse(req.body);
      const genericResponse = { message: "Si el usuario existe, se envió un correo con instrucciones." };

      const systemAdmin = await prisma.systemAdmin.findUnique({ where: { email: username } });
      const clientMember = !systemAdmin ? await prisma.clientMember.findFirst({ where: { username } }) : null;
      const member = !systemAdmin && !clientMember
        ? await prisma.member.findFirst({ where: { OR: [{ email: username }, { username }] } })
        : null;

      const target = systemAdmin
        ? { id: systemAdmin.id, email: systemAdmin.email, userType: "SYSTEM_ADMIN" as const }
        : clientMember
        ? (clientMember.email ? { id: clientMember.id, email: clientMember.email, userType: "CLIENT_MEMBER" as const } : null)
        : member
        ? { id: member.id, email: member.email, userType: "MEMBER" as const }
        : null;

      if (!target) {
        res.json(genericResponse);
        return;
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await prisma.passwordResetToken.create({
        data: { token, userId: target.id, userType: target.userType, expiresAt },
      });

      const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`;
      await sendPasswordResetEmail(target.email, resetUrl);

      res.json(genericResponse);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * POST /auth/reset-password
 * Consumes a reset token issued by /forgot-password and sets a new password.
 */
router.post(
  "/reset-password",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      const record = await prisma.passwordResetToken.findUnique({ where: { token } });
      if (!record || record.usedAt || record.expiresAt < new Date()) {
        throw new HttpError(400, "Invalid or expired token");
      }

      const hash = await bcrypt.hash(newPassword, 10);
      if (record.userType === "SYSTEM_ADMIN") {
        await prisma.systemAdmin.update({ where: { id: record.userId }, data: { password: hash } });
      } else if (record.userType === "CLIENT_MEMBER") {
        await prisma.clientMember.update({ where: { id: record.userId }, data: { password: hash } });
      } else {
        await prisma.member.update({ where: { id: record.userId }, data: { password: hash } });
      }

      await prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } });

      res.json({ message: "Password updated successfully" });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * POST /auth/refresh
 * Issues a new token for the currently authenticated user.
 */
router.post(
  "/refresh",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sub, username, name, role, orgId } = (req as AuthRequest).user;
      const payload: JwtPayload = { sub, username, name, role, orgId };
      const token = jwt.sign(payload, env.jwt.secret, {
        expiresIn: env.jwt.expiresIn,
      } as jwt.SignOptions);
      const { exp } = jwt.decode(token) as { exp: number };
      res.json({ token, expiresAt: exp });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
