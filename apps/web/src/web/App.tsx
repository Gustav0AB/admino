import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { ToastProvider } from "@/shared/components/feedback/Toast";
import { useAuth } from "@/shared/hooks/useAuth";
import { useAppLifecycle } from "@/shared/hooks/useAppLifecycle";
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
            <Route path={routes.admin} element={<AdminScreen activeTab="orgs" />} />
            <Route path={routes.adminLogs} element={<AdminScreen activeTab="logs" />} />
            <Route path={routes.expenses} element={<ExpensesScreen activeTab="gastos" />} />
            <Route path={routes.expensesFijos} element={<ExpensesScreen activeTab="fijos" />} />
            <Route path={routes.expensesIngresos} element={<ExpensesScreen activeTab="ingresos" />} />
            <Route path={routes.expensesCuentas} element={<ExpensesScreen activeTab="cuentas" />} />
            <Route path={routes.expensesVacaciones} element={<ExpensesScreen activeTab="vacaciones" />} />
            <Route path={routes.expensesResumen} element={<ExpensesScreen activeTab="resumen" />} />
            <Route path={routes.assistant} element={<AssistantScreen />} />
            <Route path={routes.athleteDashboard} element={<AthleteDashboardScreen />} />
            <Route path={routes.athleteDashboardAthletes} element={<AthletesTab />} />
            <Route path={routes.athleteTracker} element={<AthleteTrackerScreen />} />
            <Route path={routes.clientSettings} element={<ClientSettingsScreen />} />
            <Route path={routes.miembros} element={<MembersScreen />} />
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
