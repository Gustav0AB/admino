import { useAuthStore } from "@/shared/store/authStore";
import type { LoginCredentials, UserRole } from "@/shared/types/auth";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const simulateLogin = useAuthStore((s) => s.simulateLogin);
  const switchRole = useAuthStore((s) => s.switchRole);

  const hasRole = (role: UserRole): boolean => user?.role === role;
  const hasAnyRole = (roles: UserRole[]): boolean =>
    !!user && roles.includes(user.role);

  return {
    user,
    token,
    isAuthenticated,
    isInitialized,
    login,
    logout,
    simulateLogin,
    switchRole,
    hasRole,
    hasAnyRole,
    isAdmin: user?.role === "SYSTEM_ADMIN",
    isCoach: user?.role === "ORGANIZATION",
    isClient: user?.role === "CLIENT",
    isOrganization:
      user?.role === "ORGANIZATION" || user?.role === "SYSTEM_ADMIN",
  } as const;
}

export type UseAuthReturn = ReturnType<typeof useAuth>;

export type { LoginCredentials };
