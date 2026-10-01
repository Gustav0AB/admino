import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { createRouter } from "@lib/generic-router";
import { requireAuth } from "@middleware/auth";
import { AuthRequest, HttpError, JwtPayload } from "@/types";

// ── Validation schemas ─────────────────────────────────────────────────────

const createMemberSchema = z.object({
  name: z.string().min(1),
  lastname: z.string().min(1),
  birthdate: z.string().datetime({ offset: true }).or(z.string().date()),
  email: z.string().email().optional(),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_.-]+$/, "Only letters, numbers, dots, hyphens and _").optional(),
  password: z.string().min(8).optional(),
}).refine(
  (d) => (d.username == null) === (d.password == null),
  { message: "username and password must both be provided or both omitted" }
);

const updateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  lastname: z.string().min(1).optional(),
  birthdate: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  peso: z.number().positive().optional().nullable(),
  altura: z.number().positive().optional().nullable(),
  categoria: z.enum(["principiante", "intermedio", "avanzado", "semi-profesional", "profesional"]).optional().nullable(),
  grado: z.string().optional().nullable(),
});

// Self-edit: an athlete may only touch these fields on their own record.
const selfUpdateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  lastname: z.string().min(1).optional(),
  peso: z.number().positive().optional().nullable(),
  altura: z.number().positive().optional().nullable(),
});

type CreateMember = z.infer<typeof createMemberSchema>;
type UpdateMember = z.infer<typeof updateMemberSchema>;
type SelfUpdateMember = z.infer<typeof selfUpdateMemberSchema>;

// ── Select shape returned to callers ──────────────────────────────────────

const memberSelect = {
  id: true,
  name: true,
  lastname: true,
  birthdate: true,
  username: true,
  email: true,
  peso: true,
  altura: true,
  categoria: true,
  grado: true,
  isActive: true,
  joinedAt: true,
  trainingPlanAssignments: {
    orderBy: { assignedAt: "desc" },
    take: 1,
    select: { planId: true },
  },
} as const;

function withTrainingPlanId<T extends { trainingPlanAssignments: { planId: string }[] }>(
  member: T
): Omit<T, "trainingPlanAssignments"> & { trainingPlanId: string | null } {
  const { trainingPlanAssignments, ...rest } = member;
  return { ...rest, trainingPlanId: trainingPlanAssignments[0]?.planId ?? null };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function resolveClientId(query: Record<string, string>, user: JwtPayload): string {
  if (user.orgId) return user.orgId;
  if (query.clientId) return query.clientId;
  throw new HttpError(400, "clientId query parameter is required");
}

// ── Service ────────────────────────────────────────────────────────────────

const membersService = {
  async findAll(params: Record<string, string>, user: JwtPayload) {
    if (user.role === "MEMBER") throw new HttpError(403, "Forbidden");
    const clientId = resolveClientId(params, user);
    const members = await prisma.member.findMany({
      where: { clientId, isActive: true },
      select: memberSelect,
      orderBy: { joinedAt: "desc" },
    });
    return members.map(withTrainingPlanId);
  },

  async findById(id: string, user: JwtPayload) {
    if (user.role === "MEMBER" && id !== user.sub) {
      throw new HttpError(403, "Forbidden");
    }
    const member = await prisma.member.findUnique({
      where: { id },
      select: { ...memberSelect, clientId: true },
    });
    if (!member) return null;
    if (user.orgId && member.clientId !== user.orgId) {
      throw new HttpError(403, "Forbidden");
    }
    return withTrainingPlanId(member);
  },

  async create(data: CreateMember, user: JwtPayload) {
    const { name, lastname, birthdate, username } = data;
    const clientId = user.orgId;
    if (!clientId) throw new HttpError(403, "Only client members can create members");

    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { slug: true } });
    if (!client) throw new HttpError(404, "Client not found");
    const prefixedUsername = username ? `${client.slug}-${username}` : null;

    const { randomUUID } = await import("crypto");
    const email = data.email ?? `${name.toLowerCase().replace(/\s+/g, ".")}.${randomUUID().slice(0, 6)}@member.local`;
    const rawPassword = data.password ?? randomUUID();

    if (prefixedUsername) {
      const usernameConflict = await prisma.member.findFirst({ where: { username: prefixedUsername, clientId } });
      if (usernameConflict) throw new HttpError(409, "Username already taken");
    }

    const emailConflict = await prisma.member.findFirst({ where: { email, clientId } });
    if (emailConflict) throw new HttpError(409, "A member with this email already exists");

    const bcrypt = await import("bcryptjs");
    const hashed = await bcrypt.hash(rawPassword, 10);

    const created = await prisma.member.create({
      data: {
        name,
        lastname,
        birthdate: birthdate ? new Date(birthdate) : null,
        username: prefixedUsername,
        email,
        password: hashed,
        clientId,
      },
      select: memberSelect,
    });
    return withTrainingPlanId(created);
  },

  async update(id: string, data: UpdateMember, user: JwtPayload) {
    if (user.role === "MEMBER" && id !== user.sub) {
      throw new HttpError(403, "Forbidden");
    }
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) throw new HttpError(404, "Member not found");
    if (user.orgId && member.clientId !== user.orgId) {
      throw new HttpError(403, "Forbidden");
    }
    const { birthdate, ...rest } = data;
    const updated = await prisma.member.update({
      where: { id },
      data: { ...rest, ...(birthdate ? { birthdate: new Date(birthdate) } : {}) },
      select: memberSelect,
    });
    return withTrainingPlanId(updated);
  },

  async updateSelf(sub: string, data: SelfUpdateMember) {
    const updated = await prisma.member.update({
      where: { id: sub },
      data,
      select: memberSelect,
    });
    return withTrainingPlanId(updated);
  },

  async remove(id: string, user: JwtPayload) {
    if (user.role === "MEMBER" && id !== user.sub) {
      throw new HttpError(403, "Forbidden");
    }
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) throw new HttpError(404, "Member not found");
    if (user.orgId && member.clientId !== user.orgId) {
      throw new HttpError(403, "Forbidden");
    }
    await prisma.member.update({ where: { id }, data: { isActive: false } });
  },
};

// ── Router ────────────────────────────────────────────────────────────────

type MemberRow = { id: string; name: string; lastname: string; birthdate: Date | null; username: string | null; email: string; peso: number | null; altura: number | null; categoria: string | null; grado: string | null; isActive: boolean; joinedAt: Date; trainingPlanId: string | null };

const router = Router();
router.use(requireAuth);

// Registered before the generic `/:id` router below so "me" is never
// treated as a member id.
router.get("/me", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    const member = await membersService.findById(user.sub, user);
    if (!member) throw new HttpError(404, "Member not found");
    res.json(member);
  } catch (e) {
    next(e);
  }
});

router.patch("/me", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    const body = selfUpdateMemberSchema.parse(req.body);
    const member = await membersService.updateSelf(user.sub, body);
    res.json(member);
  } catch (e) {
    next(e);
  }
});

router.use(
  createRouter<MemberRow, CreateMember, UpdateMember>({
    service: membersService,
    createSchema: createMemberSchema,
    updateSchema: updateMemberSchema,
  })
);

export default router;
