import type {
  OrgMember,
  OrgClient,
  ClientRole,
  OrgNotification,
  OrgPlan,
} from "@/shared/types/member";

export const mockOrgMembers: OrgMember[] = [
  {
    id: "mem-1",
    name: "Sam Coach",
    username: "sam_coach",
    role: "OWNER",
    isActive: true,
    permissions: [],
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "mem-2",
    name: "Ana Trainer",
    username: "ana_trainer",
    role: "ADMIN",
    isActive: true,
    permissions: ["log_access", "payments"],
    createdAt: "2024-02-10T08:00:00Z",
  },
  {
    id: "mem-3",
    name: "Luis Helper",
    username: "luis_helper",
    role: "MEMBER",
    isActive: false,
    permissions: ["log_access"],
    createdAt: "2024-03-05T08:00:00Z",
  },
];

export const mockOrgClients: OrgClient[] = [
  {
    id: "client-1",
    name: "John Athlete",
    email: "john@demo.com",
    isActive: true,
    joinedAt: "2024-01-20T08:00:00Z",
  },
  {
    id: "client-2",
    name: "Maria Runner",
    email: "maria@demo.com",
    isActive: true,
    joinedAt: "2024-02-14T08:00:00Z",
  },
  {
    id: "client-3",
    name: "Carlos Swim",
    email: "carlos@demo.com",
    isActive: true,
    joinedAt: "2024-03-01T08:00:00Z",
  },
  {
    id: "client-4",
    name: "Sara Lift",
    email: "sara@demo.com",
    isActive: false,
    joinedAt: "2023-11-20T08:00:00Z",
  },
];

export const mockClientRoles: ClientRole[] = [
  {
    id: "role-1",
    name: "Editor",
    permissions: ["log_access", "training_planning"],
    _count: { members: 3 },
    createdAt: "2024-02-01T08:00:00Z",
  },
  {
    id: "role-2",
    name: "Viewer",
    permissions: ["log_access"],
    _count: { members: 8 },
    createdAt: "2024-03-15T08:00:00Z",
  },
];

export const mockNotifications: OrgNotification[] = [
  {
    id: "notif-1",
    title: "Bienvenido al gimnasio",
    body: "Hola, estás oficialmente registrado en FitLife Studio.",
    recipientId: "client-1",
    recipientType: "MEMBER",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "notif-2",
    title: "Nueva clase disponible",
    body: "Este sábado tenemos una clase especial de yoga. ¡Inscríbete!",
    recipientId: "mock-admin-1",
    recipientType: "ORG_MEMBER",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "notif-3",
    title: "Recordatorio de pago",
    body: "Tu membresía vence en 3 días. Renueva para seguir disfrutando.",
    recipientId: "mock-admin-1",
    recipientType: "ORG_MEMBER",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
];

export const mockOrgPlans: OrgPlan[] = [
  {
    id: "plan-1",
    name: "Plan Básico",
    description: "Acceso a funciones esenciales para empezar.",
    status: "ACTIVE",
    maxUsers: 25,
    features: {
      log_access: true,
      payments: false,
      training_planning: false,
      tracker: false,
      patients: false,
      nutritionist_planning: false,
    },
    createdAt: "2024-01-01T00:00:00Z",
    _count: { assignments: 2 },
  },
  {
    id: "plan-2",
    name: "Plan Premium",
    description: "Todas las funciones sin límites.",
    status: "ACTIVE",
    maxUsers: 200,
    features: {
      log_access: true,
      payments: true,
      training_planning: true,
      tracker: true,
      patients: true,
      nutritionist_planning: true,
    },
    createdAt: "2024-01-01T00:00:00Z",
    _count: { assignments: 1 },
  },
];
