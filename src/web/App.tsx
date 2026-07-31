import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { OfflineBanner } from "@generic/components";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { SessionGuardModal } from "@/shared/components/feedback/SessionGuardModal";
import { ToastProvider } from "@/shared/components/feedback/Toast";
import { useAuth } from "@/shared/hooks/useAuth";
import { useAppLifecycle } from "@/shared/hooks/useAppLifecycle";
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

const navItems: { label: string; href?: string; roles: UserRole[]; children?: { label: string; href: string }[] }[] = [
  { label: "Dashboard", href: "/(drawer)", roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN", "MEMBER"] },
  {
    label: "Admin",
    roles: ["SYSTEM_ADMIN"],
    children: [
      { label: "Organizaciones", href: "/(drawer)/admin" },
      { label: "Audit Logs", href: "/(drawer)/admin/logs" },
      { label: "Security", href: "/(drawer)/admin/security" },
    ],
  },
  {
    label: "Finanzas",
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    children: [
      { label: "Todos los gastos", href: "/(drawer)/expenses" },
      { label: "Gastos Fijos", href: "/(drawer)/expenses/fijos" },
      { label: "Ingresos", href: "/(drawer)/expenses/ingresos" },
      { label: "Cuentas", href: "/(drawer)/expenses/cuentas" },
      { label: "Vacaciones", href: "/(drawer)/expenses/vacaciones" },
      { label: "Resumen", href: "/(drawer)/expenses/resumen" },
    ],
  },
  {
    label: "Planes",
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    children: [
      { label: "Calendario", href: "/(drawer)/athlete-dashboard" },
      { label: "Atletas", href: "/(drawer)/athlete-dashboard/athletes" },
    ],
  },
  { label: "Tracker", href: "/(drawer)/tracker", roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"] },
  { label: "Mi entrenamiento", href: "/(drawer)/athlete-tracker", roles: ["MEMBER"] },
  { label: "Miembros", href: "/(drawer)/miembros", roles: ["OWNER", "ADMIN"] },
  { label: "Configuración", href: "/(drawer)/client-settings", roles: ["OWNER", "ADMIN"] },
];

function pathFromHash() {
  return window.location.hash.slice(1).split("?")[0] || "/";
}

function AppContent() {
  const [path, setPath] = useState(pathFromHash);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const { isAuthenticated, isInitialized, user, logout } = useAuth();
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
        <aside className="app-sidebar">
          <div className="app-brand">
            <span className="app-brand-mark">A</span>
            <span>Admino</span>
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
                >
                  <span>{item.label}</span>
                  <span>{openGroup === item.label ? "⌃" : "⌄"}</span>
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
              >
                {item.label}
              </button>
            ))}
          </nav>
          <button type="button" className="app-logout" onClick={signOut}>Logout</button>
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
