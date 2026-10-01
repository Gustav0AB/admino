import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, type ReactNode, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { ToastProvider } from "@/shared/components/feedback/Toast";
import { useAuth } from "@/shared/hooks/useAuth";
import { useAppLifecycle } from "@/shared/hooks/useAppLifecycle";
import { useClientStore } from "@/shared/store/clientStore";
import type { UserRole } from "@/shared/types/auth";
import type { ClientFeature } from "@/shared/types/client";
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

function FeatureRoute({ feature, roles, children }: { feature: ClientFeature; roles: UserRole[]; children: ReactNode }) {
  const { user, hasAnyRole } = useAuth();
  const features = useClientStore((s) => s.features);
  return hasAnyRole(roles) && (user?.role === "SYSTEM_ADMIN" || features.includes(feature)) ? children : <Navigate to={routes.dashboard} replace />;
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
            <Route path={routes.expenses} element={<FeatureRoute feature="finanzas" roles={["SYSTEM_ADMIN", "OWNER", "ADMIN"]}><ExpensesScreen /></FeatureRoute>} />
            <Route path={routes.notes} element={<FeatureRoute feature="notes" roles={["SYSTEM_ADMIN", "OWNER", "ADMIN"]}><AssistantScreen /></FeatureRoute>} />
            <Route path={routes.assistant} element={<Navigate to={routes.notes} replace />} />
            <Route path={routes.athleteDashboard} element={<FeatureRoute feature="athlete_dashboard" roles={["SYSTEM_ADMIN", "OWNER", "ADMIN"]}><AthleteDashboardScreen /></FeatureRoute>} />
            <Route path={routes.athleteDashboardAthletes} element={<FeatureRoute feature="athlete_dashboard" roles={["SYSTEM_ADMIN", "OWNER", "ADMIN"]}><AthletesTab /></FeatureRoute>} />
            <Route path={routes.athleteTracker} element={<FeatureRoute feature="athlete_tracker" roles={["MEMBER"]}><AthleteTrackerScreen /></FeatureRoute>} />
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
