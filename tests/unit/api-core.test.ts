import express from "express";
import { describe, expect, it, vi } from "vitest";
import { HttpError } from "@/types";
import { requireAuth, requireFeature, requireRole, loadOrgContext } from "@middleware/auth";
import { errorHandler } from "@middleware/error";
import { responseWrapper } from "@middleware/response";
import { BaseService } from "@lib/base-service";
import { createRouter } from "@lib/generic-router";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { prisma } from "@lib/prisma";

vi.mock("@lib/prisma", () => ({ prisma: { client: { findUnique: vi.fn() } } }));

const next = vi.fn();
const response = () => ({ statusCode: 200, status: vi.fn(function (this: { statusCode: number }, n: number) { this.statusCode = n; return this; }), json: vi.fn(), send: vi.fn(), on: vi.fn() });

describe("API middleware", () => {
  it("rejects missing and invalid auth, and accepts a signed token", async () => {
    const missing = {} as any;
    requireAuth({ headers: {} } as any, missing, next);
    expect(next.mock.calls.at(-1)?.[0]).toMatchObject({ statusCode: 401 });
    next.mockReset();
    const req = { headers: { authorization: `Bearer ${jwt.sign({ sub: "u", role: "OWNER", orgId: "org" }, "dev-secret")}` } } as any;
    requireAuth(req, missing, next);
    expect(req.user).toMatchObject({ sub: "u", role: "OWNER" });

    next.mockReset();
    requireAuth({ headers: { authorization: "Bearer invalid" } } as any, missing, next);
    expect(next.mock.calls.at(-1)?.[0]).toMatchObject({ statusCode: 401 });
  });

  it("enforces roles and handles unauthenticated users", () => {
    requireRole("OWNER")({} as any, {} as any, next);
    expect(next.mock.calls.at(-1)?.[0]).toMatchObject({ statusCode: 401 });
    next.mockReset();
    requireRole("OWNER")({ user: { role: "MEMBER" } } as any, {} as any, next);
    expect(next.mock.calls.at(-1)?.[0]).toMatchObject({ statusCode: 403 });
    next.mockReset();
    requireRole("OWNER")({ user: { role: "OWNER" } } as any, {} as any, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("wraps success responses and preserves API/error envelopes", () => {
    const res = response() as any;
    const originalJson = res.json;
    responseWrapper({} as any, res, next);
    res.json({ ok: true });
    expect(originalJson).toHaveBeenCalledWith(expect.objectContaining({ data: { ok: true }, statusCode: 200 }));
  });

  it("maps HTTP, validation and unknown errors", () => {
    for (const err of [new HttpError(403, "Forbidden"), new z.ZodError([]), new Error("boom")]) {
      const res = response() as any;
      errorHandler(err, { path: "/x" } as any, res, next);
      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    }
  });
});

describe("API authorization context", () => {
  it("allows system admins and rejects missing feature context", async () => {
    const middleware = requireFeature("reports");
    await middleware({ user: { role: "SYSTEM_ADMIN" } } as any, {} as any, next);
    expect(next).toHaveBeenCalledWith();
    next.mockReset();
    await middleware({ user: { role: "OWNER" } } as any, {} as any, next);
    expect(next.mock.calls.at(-1)?.[0]).toMatchObject({ statusCode: 403 });
    next.mockReset();
    await middleware({ user: { role: "OWNER", orgId: "org" } } as any, {} as any, next);
    expect(next.mock.calls.at(-1)?.[0]).toMatchObject({ statusCode: 403 });
    (prisma.client.findUnique as any).mockResolvedValueOnce({ clientPermissions: ["reports"], memberPermissions: [] });
    next.mockReset();
    await middleware({ user: { role: "OWNER", orgId: "org" } } as any, {} as any, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("skips org loading when no org and rejects inactive orgs", async () => {
    await loadOrgContext({} as any, {} as any, next);
    expect(next).toHaveBeenCalledWith();
    next.mockReset();
    (prisma.client.findUnique as any).mockResolvedValueOnce({ id: "org", name: "Org", slug: "org", branding: {}, isActive: false });
    await loadOrgContext({ user: { orgId: "org" } } as any, {} as any, next);
    expect(next.mock.calls.at(-1)?.[0]).toMatchObject({ statusCode: 403 });
    next.mockReset();
    (prisma.client.findUnique as any).mockResolvedValueOnce({ id: "org", name: "Org", slug: "org", branding: {}, isActive: true });
    const req = { user: { orgId: "org" } } as any;
    await loadOrgContext(req, {} as any, next);
    expect(req.org).toMatchObject({ id: "org", slug: "org" });
  });
});

type Row = { id: string; organizationId: string; value: string };
class RowsService extends BaseService<Row, { value: string }, { value?: string }> {
  protected readonly resourceName = "Row";
  protected readonly delegate = {
    findMany: vi.fn(async () => [{ id: "1", organizationId: "org", value: "a" }]),
    findUnique: vi.fn(async ({ where }: any) => where.id === "missing" ? null : ({ id: where.id, organizationId: "org", value: "a" })),
    create: vi.fn(async ({ data }: any) => ({ id: "2", ...data })),
    update: vi.fn(async ({ where, data }: any) => ({ id: where.id, organizationId: "org", ...data })),
    delete: vi.fn(async ({ where }: any) => ({ id: where.id, organizationId: "org", value: "a" })),
    count: vi.fn(async () => 1),
  };
}

describe("shared API CRUD", () => {
  it("scopes base service reads and writes to the organization", async () => {
    const service = new RowsService();
    const user = { sub: "u", role: "OWNER", orgId: "org" } as any;
    expect(await service.findAll({ query: {}, user })).toHaveLength(1);
    expect(await service.create({ value: "b" }, user)).toMatchObject({ organizationId: "org" });
    await expect(service.findById("missing", user)).rejects.toMatchObject({ statusCode: 404 });
    await expect(service.findById("1", { ...user, orgId: "other" })).rejects.toMatchObject({ statusCode: 403 });
    await expect(service.create({ value: "b" }, { ...user, orgId: null })).rejects.toMatchObject({ statusCode: 403 });
    await service.update("1", { value: "c" }, user);
    await service.remove("1", user);
  });

  it("requires orgId for system-admin list queries", async () => {
    const service = new RowsService();
    await expect(service.findAll({ query: {}, user: { orgId: null } } as any)).rejects.toMatchObject({ statusCode: 400 });
    expect(await service.findAll({ query: { orgId: "org" }, user: { orgId: null } } as any)).toHaveLength(1);
  });

  it("mounts generic CRUD handlers and validates missing resources", async () => {
    const service = new RowsService();
    const router = createRouter({ service: {
      findAll: async () => [{ id: "1" }],
      findById: async (id) => id === "missing" ? null : ({ id }),
      create: async (data) => ({ id: "2", ...data as any }),
      update: async (id, data) => ({ id, ...data as any }),
      remove: async () => undefined,
    }, createSchema: z.object({ value: z.string() }), updateSchema: z.object({ value: z.string() }) });
    const app = express().use(express.json()).use("/rows", router).use((err: unknown, _req: any, res: any, _next: any) => res.status(500).json(err));
    const server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    const address = server.address() as { port: number };
    const base = `http://127.0.0.1:${address.port}/rows`;
    expect((await fetch(base)).status).toBe(200);
    expect((await fetch(`${base}/missing`)).status).toBe(500);
    expect((await fetch(base, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value: "x" }) })).status).toBe(201);
    expect((await fetch(`${base}/1`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ value: "x" }) })).status).toBe(200);
    expect((await fetch(`${base}/1`, { method: "DELETE" })).status).toBe(204);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
