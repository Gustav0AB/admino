import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, type ReactNode, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { ToastProvider } from "@/shared/components/feedback/Toast";
import { useAuth } from "@/shared/hooks/useAuth";
import { useAppLifecycle } from "@/shared/hooks/useAppLifecycle";
import type { UserRole } from "@/shared/types/auth";
import { AppLayout } from "./layouts/AppLayout";
import { routes } from "./routes";

const queryClient = new QueryClient();
const LoginPage = lazy(() => import("./pages/auth/login"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/forgot-password"));
const ResetPasswordPage = lazy(() => import("./pages/auth/reset-password"));
const DashboardPage = lazy(() => import("./pages/dashboard"));
const AdminScreen = lazy(() => import("@/features/admin/AdminScreen").then((m) => ({ default: m.AdminScreen })));
const ExpensesScreen = lazy(() => import("@/features/expenses/screens/ExpensesScreen").then((m) => ({ default: m.ExpensesScreen })));
const AthleteDashboardScreen = lazy(() => import("@/features/athlete-dashboard").then((m) => ({ default: m.AthleteDashboardScreen })));
const AthleteTrackerScreen = lazy(() => import("@/features/athlete-tracker").then((m) => ({ default: m.AthleteTrackerScreen })));
const AthletesTab = lazy(() => import("@/features/athlete-dashboard/athletes").then((m) => ({ default: m.AthletesTab })));
const ClientSettingsScreen = lazy(() => import("@/features/client-settings/ClientSettingsScreen").then((m) => ({ default: m.ClientSettingsScreen })));
const MembersScreen = lazy(() => import("@/features/members").then((m) => ({ default: m.MembersScreen })));
const AssistantScreen = lazy(() => import("@/features/assistant").then((m) => ({ default: m.AssistantScreen })));

function PublicRoute() {
  const { isAuthenticated, isInitialized } = useAuth();
  if (!isInitialized) return null;
  return isAuthenticated ? <Navigate to={routes.dashboard} replace /> : <Outlet />;
}

function ProtectedRoute() {
  const { isAuthenticated, isInitialized } = useAuth();
  if (!isInitialized) return null;
  return isAuthenticated ? <Outlet /> : <Navigate to={routes.login} replace />;
}

function RoleRoute({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { hasAnyRole } = useAuth();
  return hasAnyRole(roles) ? children : <Navigate to={routes.dashboard} replace />;
}

function AppRoutes() {
  useAppLifecycle();

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path={routes.login} element={<LoginPage />} />
          <Route path={routes.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={routes.resetPassword} element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={routes.dashboard} element={<DashboardPage />} />
            <Route path={routes.admin} element={<RoleRoute roles={["SYSTEM_ADMIN"]}><AdminScreen activeTab="orgs" /></RoleRoute>} />
            <Route path={routes.adminLogs} element={<RoleRoute roles={["SYSTEM_ADMIN"]}><AdminScreen activeTab="logs" /></RoleRoute>} />
            <Route path={routes.expenses} element={<RoleRoute roles={["SYSTEM_ADMIN", "OWNER", "ADMIN"]}><ExpensesScreen activeTab="gastos" /></RoleRoute>} />
            <Route path={routes.expensesFijos} element={<RoleRoute roles={["SYSTEM_ADMIN", "OWNER", "ADMIN"]}><ExpensesScreen activeTab="fijos" /></RoleRoute>} />
            <Route path={routes.expensesIngresos} element={<RoleRoute roles={["SYSTEM_ADMIN", "OWNER", "ADMIN"]}><ExpensesScreen activeTab="ingresos" /></RoleRoute>} />
            <Route path={routes.expensesCuentas} element={<RoleRoute roles={["SYSTEM_ADMIN", "OWNER", "ADMIN"]}><ExpensesScreen activeTab="cuentas" /></RoleRoute>} />
            <Route path={routes.expensesVacaciones} element={<RoleRoute roles={["SYSTEM_ADMIN", "OWNER", "ADMIN"]}><ExpensesScreen activeTab="vacaciones" /></RoleRoute>} />
            <Route path={routes.expensesResumen} element={<RoleRoute roles={["SYSTEM_ADMIN", "OWNER", "ADMIN"]}><ExpensesScreen activeTab="resumen" /></RoleRoute>} />
            <Route path={routes.notes} element={<RoleRoute roles={["SYSTEM_ADMIN", "OWNER", "ADMIN"]}><AssistantScreen /></RoleRoute>} />
            <Route path={routes.assistant} element={<Navigate to={routes.notes} replace />} />
            <Route path={routes.athleteDashboard} element={<RoleRoute roles={["SYSTEM_ADMIN", "OWNER", "ADMIN"]}><AthleteDashboardScreen /></RoleRoute>} />
            <Route path={routes.athleteDashboardAthletes} element={<RoleRoute roles={["SYSTEM_ADMIN", "OWNER", "ADMIN"]}><AthletesTab /></RoleRoute>} />
            <Route path={routes.athleteTracker} element={<RoleRoute roles={["MEMBER"]}><AthleteTrackerScreen /></RoleRoute>} />
            <Route path={routes.clientSettings} element={<RoleRoute roles={["OWNER", "ADMIN"]}><ClientSettingsScreen /></RoleRoute>} />
            <Route path={routes.miembros} element={<RoleRoute roles={["OWNER", "ADMIN"]}><MembersScreen /></RoleRoute>} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to={routes.dashboard} replace />} />
        <Route path="*" element={<Navigate to={routes.dashboard} replace />} />
      </Routes>
    </Suspense>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </ToastProvider>
    </QueryClientProvider>
  );
}
