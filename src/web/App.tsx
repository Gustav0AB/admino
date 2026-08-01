import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { OfflineBanner } from "@/shared/ui";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import GroupIcon from "@mui/icons-material/Group";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { SessionGuardModal } from "@/shared/components/feedback/SessionGuardModal";
import { ToastProvider } from "@/shared/components/feedback/Toast";
import { useAuth } from "@/shared/hooks/useAuth";
import { useAppLifecycle } from "@/shared/hooks/useAppLifecycle";
import { useSidebarStore } from "@/shared/hooks/useSidebarToggle";
import SignInScreen from "./pages/auth/sign-in";
import ForgotPasswordScreen from "./pages/auth/forgot-password";
import ResetPasswordScreen from "./pages/auth/reset-password";
import DashboardScreen from "./pages/drawer";
import PlanningScreen from "./pages/drawer/planning";
import { AdminScreen, type AdminTab } from "@/features/admin";
import { ExpensesScreen, type ExpenseTab } from "@/features/expenses/screens/ExpensesScreen";
import { AthleteDashboardScreen } from "@/features/athlete-dashboard";
import { AthleteTrackerScreen } from "@/features/athlete-tracker";
import { AthletesTab } from "@/features/athlete-dashboard/athletes";
import { ClientSettingsScreen } from "@/features/client-settings";
import { LogAccessScreen } from "@/features/log-access";
import { MembersScreen } from "@/features/members";
import { NutritionistPlanningScreen } from "@/features/nutritionist-planning";
import { PatientsScreen } from "@/features/patients";
import { PaymentsScreen } from "@/features/payments";
import { AssistantScreen } from "@/features/assistant";
import type { UserRole } from "@/shared/types/auth";

const queryClient = new QueryClient();

const expenseRoute = (activeTab: ExpenseTab) => () => <ExpensesScreen activeTab={activeTab} />;
const adminRoute = (activeTab: AdminTab) => () => <AdminScreen activeTab={activeTab} />;

const routes: Record<string, React.ComponentType> = {
  "/(auth)/sign-in": SignInScreen,
  "/(auth)/forgot-password": ForgotPasswordScreen,
  "/(auth)/reset-password": ResetPasswordScreen,
  "/(drawer)": DashboardScreen,
  "/(drawer)/": DashboardScreen,
  "/(drawer)/planning": PlanningScreen,
  "/(drawer)/admin": adminRoute("orgs"),
  "/(drawer)/admin/logs": adminRoute("logs"),
  "/(drawer)/admin/security": adminRoute("security"),
  "/(drawer)/expenses": expenseRoute("gastos"),
  "/(drawer)/expenses/fijos": expenseRoute("fijos"),
  "/(drawer)/expenses/ingresos": expenseRoute("ingresos"),
  "/(drawer)/expenses/cuentas": expenseRoute("cuentas"),
  "/(drawer)/expenses/vacaciones": expenseRoute("vacaciones"),
  "/(drawer)/expenses/resumen": expenseRoute("resumen"),
  "/(drawer)/assistant": AssistantScreen,
  "/(drawer)/athlete-dashboard": AthleteDashboardScreen,
  "/(drawer)/athlete-tracker": AthleteTrackerScreen,
  "/(drawer)/tracker": AthletesTab,
  "/(drawer)/athlete-dashboard/athletes": AthletesTab,
  "/(drawer)/client-settings": ClientSettingsScreen,
  "/(drawer)/log-access": LogAccessScreen,
  "/(drawer)/miembros": MembersScreen,
  "/(drawer)/nutritionist-planning": NutritionistPlanningScreen,
  "/(drawer)/patients": PatientsScreen,
  "/(drawer)/payments": PaymentsScreen
};

const navItems: { label: string; href?: string; roles: UserRole[]; icon: React.ReactNode; children?: { label: string; href: string }[] }[] = [
  { label: "Dashboard", href: "/(drawer)", roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN", "MEMBER"], icon: <DashboardIcon fontSize="small" /> },
  {
    label: "Admin",
    roles: ["SYSTEM_ADMIN"],
    icon: <AdminPanelSettingsIcon fontSize="small" />,
    children: [
      { label: "Organizaciones", href: "/(drawer)/admin" },
      { label: "Audit Logs", href: "/(drawer)/admin/logs" },
      { label: "Security", href: "/(drawer)/admin/security" },
    ],
  },
  {
    label: "Finanzas",
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    icon: <AccountBalanceWalletIcon fontSize="small" />,
    children: [
      { label: "Todos los gastos", href: "/(drawer)/expenses" },
      { label: "Gastos Fijos", href: "/(drawer)/expenses/fijos" },
      { label: "Ingresos", href: "/(drawer)/expenses/ingresos" },
      { label: "Cuentas", href: "/(drawer)/expenses/cuentas" },
      { label: "Vacaciones", href: "/(drawer)/expenses/vacaciones" },
      { label: "Resumen", href: "/(drawer)/expenses/resumen" },
    ],
  },
  { label: "Asistente", href: "/(drawer)/assistant", roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"], icon: <AutoAwesomeIcon fontSize="small" /> },
  {
    label: "Planes",
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    icon: <CalendarMonthIcon fontSize="small" />,
    children: [
      { label: "Calendario", href: "/(drawer)/athlete-dashboard" },
      { label: "Atletas", href: "/(drawer)/athlete-dashboard/athletes" },
    ],
  },
  { label: "Tracker", href: "/(drawer)/tracker", roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"], icon: <FitnessCenterIcon fontSize="small" /> },
  { label: "Mi entrenamiento", href: "/(drawer)/athlete-tracker", roles: ["MEMBER"], icon: <DirectionsRunIcon fontSize="small" /> },
  { label: "Miembros", href: "/(drawer)/miembros", roles: ["OWNER", "ADMIN"], icon: <GroupIcon fontSize="small" /> },
  { label: "Configuración", href: "/(drawer)/client-settings", roles: ["OWNER", "ADMIN"], icon: <SettingsIcon fontSize="small" /> },
];

function pathFromHash() {
  return window.location.hash.slice(1).split("?")[0] || "/";
}

function AppContent() {
  const [path, setPath] = useState(pathFromHash);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const { isAuthenticated, isInitialized, user, logout } = useAuth();
  const { isOpen, toggle } = useSidebarStore();
  useAppLifecycle();

  useEffect(() => {
    const onHashChange = () => setPath(pathFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const target = useMemo(() => {
    if (!isInitialized) return null;
    if (path === "/") return "/(auth)/sign-in";
    if (!isAuthenticated && !path.startsWith("/(auth)")) return "/(auth)/sign-in";
    return null;
  }, [isAuthenticated, isInitialized, path]);

  useEffect(() => {
    if (target) window.location.hash = target;
  }, [target]);

  const visibleNavItems = useMemo(() => navItems.filter((item) => user && item.roles.includes(user.role)), [user]);

  useEffect(() => {
    const activeGroup = visibleNavItems.find((item) => item.children?.some((child) => child.href === path));
    if (activeGroup) setOpenGroup(activeGroup.label);
  }, [path, visibleNavItems]);

  if (!isInitialized || target) return null;

  const Page = routes[path] ?? DashboardScreen;
  const isAuthPage = path.startsWith("/(auth)");

  const go = (href: string) => {
    window.location.hash = href;
  };

  const signOut = () => {
    logout();
    window.location.hash = "/(auth)/sign-in";
  };

  return (
    <div className="app-shell">
      {!isAuthPage && (
        <aside className={`app-sidebar ${!isOpen ? "collapsed" : ""}`}>
          <div className="app-brand" style={{ justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span className="app-brand-mark">A</span>
              <span>Admino</span>
            </div>
            <button
              type="button"
              onClick={toggle}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-primary)",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <MenuIcon fontSize="small" />
            </button>
          </div>
          <div className="app-user">
            <div className="app-user-name">{user?.name}</div>
            <div className="app-user-role">{user?.role}</div>
          </div>
          <nav className="app-nav">
            {visibleNavItems.map((item) => item.children ? (
              <div key={item.label} className="app-nav-group">
                <button
                  type="button"
                  className={`app-nav-item app-nav-group-button ${openGroup === item.label ? "app-nav-item-active" : ""}`}
                  onClick={() => setOpenGroup((current) => current === item.label ? null : item.label)}
                  title={item.label}
                >
                  <span className="app-nav-icon">{item.icon}</span>
                  <span className="app-nav-label">{item.label}</span>
                  <span className="app-nav-caret">{openGroup === item.label ? "⌃" : "⌄"}</span>
                </button>
                {openGroup === item.label && (
                  <div className="app-nav-children">
                    {item.children.map((child) => (
                      <button
                        key={child.href}
                        className={`app-nav-item app-nav-subitem ${path === child.href ? "app-nav-item-active" : ""}`}
                        onClick={() => go(child.href)}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                key={item.href}
                className={`app-nav-item ${path === item.href ? "app-nav-item-active" : ""}`}
                onClick={() => item.href && go(item.href)}
                title={item.label}
              >
                <span className="app-nav-icon">{item.icon}</span>
                <span className="app-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
          <button type="button" className="app-logout" onClick={signOut} title="Logout">
            <span className="app-nav-icon"><LogoutIcon fontSize="small" /></span>
            <span className="app-nav-label">Logout</span>
          </button>
        </aside>
      )}
      <main className="app-main">
        <Page />
        {!isAuthPage && (
          <>
            <OfflineBanner />
            <SessionGuardModal />
          </>
        )}
      </main>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ToastProvider>
    </QueryClientProvider>
  );
}
