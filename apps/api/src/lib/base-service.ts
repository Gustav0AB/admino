import { prisma } from "@lib/prisma";
import { HttpError, JwtPayload } from "@/types";

export type PrismaDelegate<T, CreateInput, UpdateInput> = {
  findMany: (args: {
    where: Record<string, unknown>;
    orderBy?: Record<string, unknown>;
    skip?: number;
    take?: number;
  }) => Promise<T[]>;
  findUnique: (args: { where: { id: string } }) => Promise<(T & { organizationId?: string }) | null>;
  create: (args: { data: CreateInput & { organizationId: string } }) => Promise<T>;
  update: (args: { where: { id: string }; data: Partial<UpdateInput> }) => Promise<T>;
  delete: (args: { where: { id: string } }) => Promise<T>;
  count: (args: { where: Record<string, unknown> }) => Promise<number>;
};

export interface FindAllParams {
  query: Record<string, string>;
  user: JwtPayload;
  where?: Record<string, unknown>;
  orderBy?: Record<string, unknown>;
  skip?: number;
  take?: number;
}

function resolveOrgId(query: Record<string, string>, user: JwtPayload): string {
  if (user.orgId) return user.orgId;
  if (query.orgId) return query.orgId;
  throw new HttpError(400, "orgId query parameter is required");
}

async function assertOrgAccess(
  record: { organizationId?: string } | null,
  user: JwtPayload,
  resourceName: string
): Promise<void> {
  if (!record) throw new HttpError(404, `${resourceName} not found`);
  if (user.orgId && record.organizationId !== user.orgId) {
    throw new HttpError(403, "Forbidden");
  }
}

export abstract class BaseService<T, CreateInput, UpdateInput> {
  protected abstract readonly resourceName: string;
  protected abstract readonly delegate: PrismaDelegate<T, CreateInput, UpdateInput>;

  async findAll(params: FindAllParams): Promise<T[]> {
    const organizationId = resolveOrgId(params.query, params.user);
    return this.delegate.findMany({
      where: { organizationId, ...params.where },
      orderBy: params.orderBy ?? { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    });
  }

  async findById(id: string, user: JwtPayload): Promise<T> {
    const record = await this.delegate.findUnique({ where: { id } });
    await assertOrgAccess(record as { organizationId?: string } | null, user, this.resourceName);
    return record as T;
  }

  async create(data: CreateInput, user: JwtPayload): Promise<T> {
    const organizationId = user.orgId;
    if (!organizationId) {
      throw new HttpError(403, `Only org members can create ${this.resourceName.toLowerCase()}s`);
    }
    return this.delegate.create({ data: { ...data, organizationId } as CreateInput & { organizationId: string } });
  }

  async update(id: string, data: Partial<UpdateInput>, user: JwtPayload): Promise<T> {
    const record = await this.delegate.findUnique({ where: { id } });
    await assertOrgAccess(record as { organizationId?: string } | null, user, this.resourceName);
    return this.delegate.update({ where: { id }, data });
  }

  async remove(id: string, user: JwtPayload): Promise<void> {
    const record = await this.delegate.findUnique({ where: { id } });
    await assertOrgAccess(record as { organizationId?: string } | null, user, this.resourceName);
    await this.delegate.delete({ where: { id } });
  }
}

export { prisma, resolveOrgId };
