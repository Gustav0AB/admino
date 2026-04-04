import { type ReactNode } from "react";
import { Redirect } from "expo-router";
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

  if (!isInitialized) return null;

  if (!isAuthenticated || !user) {
    return redirect ? (
      <Redirect href="/(auth)/sign-in" />
    ) : null;
  }

  if (!allowedRoles.includes(user.role)) {
    return redirect ? (
      <Redirect href={fallback as Parameters<typeof Redirect>[0]["href"]} />
    ) : null;
  }

  return <>{children}</>;
}
