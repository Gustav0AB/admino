import { useAuthStore } from "@/shared/store/authStore";
import type { UserRole } from "@/shared/types/auth";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  const hasAnyRole = (roles: UserRole[]): boolean =>
    !!user && roles.includes(user.role);

  return {
    user,
    isAuthenticated,
    isInitialized,
    login,
    logout,
    hasAnyRole,
  } as const;
}
