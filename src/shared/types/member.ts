export type OrgMember = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  isActive: boolean;
  permissions: string[];
  createdAt: string;
};

export type OrgClient = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  joinedAt: string;
};

export type ClientRole = {
  id: string;
  name: string;
  permissions: string[];
  _count: { members: number };
  createdAt: string;
};

export type OrgNotification = {
  id: string;
  title: string;
  body: string;
  recipientId: string;
  recipientType: "ORG_MEMBER" | "MEMBER";
  isRead: boolean;
  createdAt: string;
};

export type OrgPlan = {
  id: string;
  name: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  maxUsers: number | null;
  features: Record<string, boolean>;
  createdAt: string;
  _count: { assignments: number };
};

export type CreateMemberInput = {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MEMBER";
  permissions: string[];
};

export type UpdateMemberInput = {
  name?: string;
  role?: "ADMIN" | "MEMBER";
  isActive?: boolean;
  permissions?: string[];
};

export type CreateClientRoleInput = {
  name: string;
  permissions: string[];
};

export type SendNotificationInput = {
  title: string;
  body: string;
  recipientIds: string[];
  recipientType: "ORG_MEMBER" | "MEMBER";
};

export const SECTION_PERMISSIONS = [
  { key: "log_access", label: "Log Access / QR" },
  { key: "payments", label: "Pagos" },
  { key: "training_planning", label: "Planificación de Entrenamientos" },
  { key: "tracker", label: "Tracker" },
  { key: "patients", label: "Pacientes" },
  { key: "nutritionist_planning", label: "Planificación Nutricional" },
  { key: "notifications", label: "Notificaciones" },
  { key: "client_roles", label: "Roles de Clientes" },
] as const;
