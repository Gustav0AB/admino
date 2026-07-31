import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/shared/store/authStore";
import { useClientStore } from "@/shared/store/clientStore";

export function useAppLifecycle() {
  const queryClient = useQueryClient();
  const { loadConfig } = useClientStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    loadConfig();
  }, [isAuthenticated]);

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

  return { showSplash: false };
}
