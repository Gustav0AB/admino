import { useAuthStore } from "@/shared/store/authStore";
import type { UserRole } from "@/shared/types/auth";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const signIn = useAuthStore((s) => s.signIn);
  const signOut = useAuthStore((s) => s.signOut);
  const switchRole = useAuthStore((s) => s.switchRole);

  const hasRole = (role: UserRole): boolean => user?.role === role;

  const hasAnyRole = (roles: UserRole[]): boolean =>
    !!user && roles.includes(user.role);

  return {
    user,
    isAuthenticated,
    isHydrated: _hasHydrated,
    signIn,
    signOut,
    switchRole,
    hasRole,
    hasAnyRole,
    isSystemAdmin: user?.role === "SYSTEM_ADMIN",
    isOrganization:
      user?.role === "ORGANIZATION" || user?.role === "SYSTEM_ADMIN",
    isClient: user?.role === "CLIENT",
  };
}
