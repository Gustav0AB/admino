import type { UserRole } from "@/shared/types/auth";
import type { ClientFeature } from "@/shared/types/client";
import { CircleDollarSign, Dumbbell, Home, NotebookText, Settings, ShieldCheck, UserRound, ClipboardList } from "lucide-react";
import type { ReactNode } from "react";
import { routes } from "./routes";

type NavItem = {
  label: string;
  roles: UserRole[];
  icon: ReactNode;
  feature?: ClientFeature;
  to?: string;
  children?: { label: string; to: string }[];
};

export const navItems: NavItem[] = [
  {
    label: "Inicio",
    to: routes.dashboard,
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN", "MEMBER"],
    icon: <Home />,
  },
  {
    label: "Administración",
    roles: ["SYSTEM_ADMIN"],
    icon: <ShieldCheck />,
    children: [
      { label: "Cuentas", to: routes.admin },
      { label: "Auditoría", to: routes.adminLogs },
    ],
  },
  {
    label: "Finanzas",
    to: routes.expenses,
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    feature: "finanzas",
    icon: <CircleDollarSign />,
  },
  {
    label: "Notas",
    to: routes.notes,
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    feature: "notes",
    icon: <NotebookText />,
  },
  {
    label: "Planeación",
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    feature: "athlete_dashboard",
    icon: <ClipboardList />,
    children: [
      { label: "Calendario", to: routes.athleteDashboard },
      { label: "Atletas", to: routes.athleteDashboardAthletes },
    ],
  },
  { label: "Planeación", to: routes.athleteTracker, roles: ["MEMBER"], feature: "athlete_tracker", icon: <Dumbbell /> },
  { label: "Miembros", to: routes.miembros, roles: ["OWNER", "ADMIN"], icon: <UserRound /> },
  { label: "Configuración", to: routes.clientSettings, roles: ["OWNER", "ADMIN"], icon: <Settings /> },
];
