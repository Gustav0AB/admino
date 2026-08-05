import type { UserRole } from "@/shared/types/auth";
import type { ReactNode } from "react";
import { routes } from "./routes";

type NavItem = {
  label: string;
  roles: UserRole[];
  icon: ReactNode;
  to?: string;
  children?: { label: string; to: string }[];
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

export const navItems: NavItem[] = [
  {
    label: "Inicio",
    to: routes.dashboard,
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN", "MEMBER"],
    icon: <Icon><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></Icon>,
  },
  {
    label: "Administración",
    roles: ["SYSTEM_ADMIN"],
    icon: <Icon><path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z" /></Icon>,
    children: [
      { label: "Organizaciones", to: routes.admin },
      { label: "Auditoría", to: routes.adminLogs },
    ],
  },
  {
    label: "Finanzas",
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    icon: <Icon><path d="M12 2v20M17 6.5h-6.5a3 3 0 0 0 0 6H14a3 3 0 0 1 0 6H7" /></Icon>,
    children: [
      { label: "Todos los gastos", to: routes.expenses },
      { label: "Gastos Fijos", to: routes.expensesFijos },
      { label: "Ingresos", to: routes.expensesIngresos },
      { label: "Cuentas", to: routes.expensesCuentas },
      { label: "Vacaciones", to: routes.expensesVacaciones },
      { label: "Resumen", to: routes.expensesResumen },
    ],
  },
  {
    label: "Notas",
    to: routes.notes,
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    icon: <Icon><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></Icon>,
  },
  {
    label: "Planes",
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    icon: <Icon><path d="M7 3h10a2 2 0 0 1 2 2v16l-7-3-7 3V5a2 2 0 0 1 2-2z" /></Icon>,
    children: [
      { label: "Calendario", to: routes.athleteDashboard },
      { label: "Atletas", to: routes.athleteDashboardAthletes },
    ],
  },
  { label: "Mi entrenamiento", to: routes.athleteTracker, roles: ["MEMBER"], icon: <Icon><path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h3" /></Icon> },
  { label: "Miembros", to: routes.miembros, roles: ["OWNER", "ADMIN"], icon: <Icon><path d="M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0" /></Icon> },
  { label: "Configuración", to: routes.clientSettings, roles: ["OWNER", "ADMIN"], icon: <Icon><path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></Icon> },
];
