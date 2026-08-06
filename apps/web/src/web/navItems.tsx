import type { UserRole } from "@/shared/types/auth";
import { CircleDollarSign, Dumbbell, Home, NotebookText, Settings, ShieldCheck, UserRound, ClipboardList } from "lucide-react";
import type { ReactNode } from "react";
import { routes } from "./routes";

type NavItem = {
  label: string;
  roles: UserRole[];
  icon: ReactNode;
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
      { label: "Organizaciones", to: routes.admin },
      { label: "Auditoría", to: routes.adminLogs },
    ],
  },
  {
    label: "Finanzas",
    to: routes.expenses,
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    icon: <CircleDollarSign />,
  },
  {
    label: "Notas",
    to: routes.notes,
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    icon: <NotebookText />,
  },
  {
    label: "Planes",
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    icon: <ClipboardList />,
    children: [
      { label: "Calendario", to: routes.athleteDashboard },
      { label: "Atletas", to: routes.athleteDashboardAthletes },
    ],
  },
  { label: "Mi entrenamiento", to: routes.athleteTracker, roles: ["MEMBER"], icon: <Dumbbell /> },
  { label: "Miembros", to: routes.miembros, roles: ["OWNER", "ADMIN"], icon: <UserRound /> },
  { label: "Configuración", to: routes.clientSettings, roles: ["OWNER", "ADMIN"], icon: <Settings /> },
];
