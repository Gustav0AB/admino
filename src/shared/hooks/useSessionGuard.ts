import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/shared/store/authStore";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";

const WARN_BEFORE_MS = 5 * 60 * 1000; // show warning 5 min before expiry
const OFFLINE_COUNTDOWN_SECONDS = 30;

export type SessionGuardType = "session_expiring" | "offline";

export type SessionGuardState = {
  visible: boolean;
  type: SessionGuardType | null;
  secondsLeft: number;
  onStayLoggedIn: () => Promise<void>;
  onLogout: () => void;
};

export function useSessionGuard(): SessionGuardState {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const tokenExpiresAt = useAuthStore((s) => s.tokenExpiresAt);
  const logout = useAuthStore((s) => s.logout);
  const refresh = useAuthStore((s) => s.refresh);
  const { isConnected } = useNetworkStatus();

  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<SessionGuardType | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Track current modal type in a ref so interval callbacks always see the latest value
  const typeRef = useRef<SessionGuardType | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const showModal = useCallback(
    (modalType: SessionGuardType, seconds: number, onExpire: () => void) => {
      typeRef.current = modalType;
      setType(modalType);
      setVisible(true);
      setSecondsLeft(seconds);
      clearCountdown();
      countdownRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearCountdown();
            onExpire();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearCountdown]
  );

  const dismissModal = useCallback(() => {
    typeRef.current = null;
    setType(null);
    setVisible(false);
    clearCountdown();
  }, [clearCountdown]);

  // Session expiry monitoring — re-arms whenever tokenExpiresAt changes (i.e. after refresh)
  useEffect(() => {
    if (warnTimerRef.current) {
      clearTimeout(warnTimerRef.current);
      warnTimerRef.current = null;
    }

    if (!isAuthenticated || !tokenExpiresAt) return;

    const now = Date.now();
    const expiresAtMs = tokenExpiresAt * 1000;
    const msUntilWarn = expiresAtMs - WARN_BEFORE_MS - now;

    const triggerWarning = () => {
      const remaining = Math.floor((expiresAtMs - Date.now()) / 1000);
      if (remaining <= 0) {
        logout();
        return;
      }
      // Don't overwrite an offline modal
      if (typeRef.current === "offline") return;
      showModal("session_expiring", remaining, () => {
        dismissModal();
        logout();
      });
    };

    if (msUntilWarn <= 0) {
      triggerWarning();
      return;
    }

    warnTimerRef.current = setTimeout(triggerWarning, msUntilWarn);

    return () => {
      if (warnTimerRef.current) {
        clearTimeout(warnTimerRef.current);
        warnTimerRef.current = null;
      }
    };
  }, [isAuthenticated, tokenExpiresAt]);

  // Offline monitoring.
  useEffect(() => {
    if (!isAuthenticated) return;

    if (!isConnected) {
      showModal("offline", OFFLINE_COUNTDOWN_SECONDS, () => {
        dismissModal();
        logout();
      });
    } else if (typeRef.current === "offline") {
      dismissModal();
    }
  }, [isConnected, isAuthenticated]);

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      clearCountdown();
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    };
  }, []);

  const onStayLoggedIn = useCallback(async () => {
    dismissModal();
    try {
      await refresh();
    } catch {
      logout();
    }
  }, [refresh, logout, dismissModal]);

  const onLogout = useCallback(() => {
    dismissModal();
    logout();
  }, [logout, dismissModal]);

  return { visible, type, secondsLeft, onStayLoggedIn, onLogout };
}
