import { type ReactNode, useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/shared/hooks/useAuth";
import type { UserRole } from "@/shared/types/auth";

type RoleGuardProps = {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: string;
};

export function RoleGuard({
  allowedRoles,
  children,
  fallback = "/(drawer)",
}: RoleGuardProps) {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const router = useRouter();

  const isAllowed =
    isAuthenticated && !!user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace("/(auth)/sign-in");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace(fallback as Parameters<typeof router.replace>[0]);
    }
  }, [isAuthenticated, user, isHydrated]);

  if (!isHydrated || !isAllowed) return null;

  return <>{children}</>;
}
