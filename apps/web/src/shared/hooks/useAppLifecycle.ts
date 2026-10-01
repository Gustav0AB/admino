import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/shared/store/authStore";
import { useClientStore } from "@/shared/store/clientStore";

export function useAppLifecycle() {
  const queryClient = useQueryClient();
  const { loadConfig } = useClientStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    loadConfig();
  }, [loadConfig, token, user?.orgId, user?.role]);

  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.clear();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") queryClient.invalidateQueries();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [queryClient]);
}
