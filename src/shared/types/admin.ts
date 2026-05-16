export type ClientType =
  | "company"
  | "gym"
  | "school"
  | "academy"
  | "organization"
  | "other";

export type AdminOrg = {
  id: string;
  name: string;
  slug: string;
  tipo: ClientType;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string | null;
  };
  isActive: boolean;
  clientPermissions: string[];
  memberPermissions: string[];
  createdAt: string;
  updatedAt: string;
  _count: { members: number; clients: number };
};

export type AdminOrgMember = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  isActive: boolean;
  permissions: string[];
};

export type AdminOrgDetail = AdminOrg & {
  members: AdminOrgMember[];
};

export type AuditLog = {
  id: string;
  actorId: string;
  actorType: "SYSTEM_ADMIN" | "ORG_MEMBER" | "MEMBER";
  action: string;
  targetId: string | null;
  targetType: string | null;
  metadata: Record<string, unknown>;
  orgId: string | null;
  createdAt: string;
};

export type CreateOrgInput = {
  name: string;
  tipo: ClientType;
  accountName: string;
  password: string;
  clientPermissions: string[];
  memberPermissions: string[];
};

export type UpdateOrgInput = {
  name?: string;
  clientPermissions?: string[];
  memberPermissions?: string[];
};

export type ImpersonateInput = {
  targetId: string;
  targetType: "ORG_MEMBER" | "MEMBER";
};

export type ImpersonateResult = {
  token: string;
  user: {
    sub: string;
    email: string;
    role: string;
    orgId: string | null;
    impersonatedBy: string;
  };
};
