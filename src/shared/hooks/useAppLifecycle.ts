import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/shared/store/authStore";
import { useOrgStore } from "@/shared/store/orgStore";

const FOREGROUND_SPLASH_DURATION_MS = 1500;

export function useAppLifecycle() {
  const [showSplash, setShowSplash] = useState(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const splashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryClient = useQueryClient();
  const isAuthHydrated = useAuthStore((s) => s._hasHydrated);
  const { isLoaded: isOrgLoaded, loadBranding } = useOrgStore();

  useEffect(() => {
    loadBranding();
  }, []);

  useEffect(() => {
    if (!isAuthHydrated || !isOrgLoaded) return;

    SplashScreen.hideAsync();

    splashTimerRef.current = setTimeout(() => {
      setShowSplash(false);
    }, FOREGROUND_SPLASH_DURATION_MS);

    return () => {
      if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
    };
  }, [isAuthHydrated, isOrgLoaded]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const previousState = appStateRef.current;
        appStateRef.current = nextState;

        const returningToForeground =
          (previousState === "background" || previousState === "inactive") &&
          nextState === "active";

        if (!returningToForeground) return;

        queryClient.invalidateQueries();

        setShowSplash(true);

        if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
        splashTimerRef.current = setTimeout(() => {
          setShowSplash(false);
        }, FOREGROUND_SPLASH_DURATION_MS);
      }
    );

    return () => {
      subscription.remove();
      if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
    };
  }, [queryClient]);

  return { showSplash };
}
