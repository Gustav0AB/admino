import { type ReactNode, useEffect } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import type { UserRole } from "@/shared/types/auth";

type RoleGuardProps = {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: string;
  redirect?: boolean;
};

export function RoleGuard({
  allowedRoles,
  children,
  fallback = "/(drawer)",
  redirect = true,
}: RoleGuardProps) {
  const { user, isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    if (!redirect || !isInitialized) return;
    if (!isAuthenticated || !user) window.location.hash = "/(auth)/sign-in";
    else if (!allowedRoles.includes(user.role)) window.location.hash = fallback;
  }, [allowedRoles, fallback, isAuthenticated, isInitialized, redirect, user]);

  if (!isInitialized) return null;

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
