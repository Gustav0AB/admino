import type { UserRole } from "@/shared/types/auth";
import { routes } from "./routes";

type NavItem = {
  label: string;
  roles: UserRole[];
  icon: string;
  to?: string;
  children?: { label: string; to: string }[];
};

export const navItems: NavItem[] = [
  { label: "Dashboard", to: routes.dashboard, roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN", "MEMBER"], icon: "D" },
  {
    label: "Admin",
    roles: ["SYSTEM_ADMIN"],
    icon: "A",
    children: [
      { label: "Organizaciones", to: routes.admin },
      { label: "Audit Logs", to: routes.adminLogs },
    ],
  },
  {
    label: "Finanzas",
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    icon: "$",
    children: [
      { label: "Todos los gastos", to: routes.expenses },
      { label: "Gastos Fijos", to: routes.expensesFijos },
      { label: "Ingresos", to: routes.expensesIngresos },
      { label: "Cuentas", to: routes.expensesCuentas },
      { label: "Vacaciones", to: routes.expensesVacaciones },
      { label: "Resumen", to: routes.expensesResumen },
    ],
  },
  { label: "Asistente", to: routes.assistant, roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"], icon: "*" },
  {
    label: "Planes",
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    icon: "P",
    children: [
      { label: "Calendario", to: routes.athleteDashboard },
      { label: "Atletas", to: routes.athleteDashboardAthletes },
    ],
  },
  { label: "Mi entrenamiento", to: routes.athleteTracker, roles: ["MEMBER"], icon: "E" },
  { label: "Miembros", to: routes.miembros, roles: ["OWNER", "ADMIN"], icon: "M" },
  { label: "Configuración", to: routes.clientSettings, roles: ["OWNER", "ADMIN"], icon: "C" },
];
