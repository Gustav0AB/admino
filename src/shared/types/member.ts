export type OrgMember = {
  id: string;
  name: string;
  username: string;
  email: string | null;
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

export type AthleteCategory = "principiante" | "intermedio" | "avanzado" | "semi-profesional" | "profesional";

export type EndUserMember = {
  id: string;
  name: string;
  lastname: string;
  birthdate: string | null;
  username: string | null;
  email: string;
  peso: number | null;
  altura: number | null;
  categoria: AthleteCategory | null;
  grado: string | null;
  isActive: boolean;
  joinedAt: string;
  trainingPlanId?: string | null;
};

export type TrainingPlan = {
  id: string;
  name: string;
  clientId: string;
  startDate: string | null;
  endDate: string | null;
  cells: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  events?: TrainingEvent[];
  _count?: { assignments: number };
};

export type TrainingEvent = {
  id: string;
  name: string;
  date: string;
  type: "competition" | "seminar" | "vacation";
  clientId: string;
  planId: string | null;
};

export type CreateEndUserMemberInput = {
  name: string;
  lastname: string;
  birthdate: string;
  username?: string;
  password?: string;
};

export type UpdateEndUserMemberInput = {
  name?: string;
  lastname?: string;
  birthdate?: string;
  isActive?: boolean;
  peso?: number | null;
  altura?: number | null;
  categoria?: AthleteCategory | null;
  grado?: string | null;
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
  username: string;
  email?: string;
  password: string;
  role: "ADMIN" | "MEMBER";
  permissions: string[];
};

export type UpdateMemberInput = {
  name?: string;
  email?: string | null;
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
  { key: "finanzas", label: "Finanzas" },
  { key: "athlete_dashboard", label: "Athlete Dashboard (admins)" },
  { key: "athlete_tracker", label: "Athlete Tracker (miembros)" },
  { key: "notifications", label: "Notificaciones" },
  { key: "client_roles", label: "Roles de Clientes" },
  // Not yet ready — coming soon
  // { key: "payments", label: "Pagos" },
  // { key: "patients", label: "Pacientes" },
  // { key: "log_access", label: "Log Access / QR" },
  // { key: "nutritionist_planning", label: "Planificación Nutricional" },
] as const;
