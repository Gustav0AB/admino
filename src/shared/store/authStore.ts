import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Platform } from "react-native";
import { authService } from "@/shared/services/authService";
import type { AuthSession, LoginCredentials, User, UserRole } from "@/shared/types/auth";

const storage = createJSONStorage(() =>
  Platform.OS === "web" ? localStorage : AsyncStorage
);

export const MOCK_USERS: Record<UserRole, User> = {
  SYSTEM_ADMIN: {
    id: "mock-admin-1",
    name: "Alex Admin",
    email: "admin@admino.app",
    role: "SYSTEM_ADMIN",
    orgId: null,
  },
  ORGANIZATION: {
    id: "mock-org-1",
    name: "Sam Coach",
    email: "coach@admino.app",
    role: "ORGANIZATION",
    orgId: "org-demo-1",
  },
  CLIENT: {
    id: "mock-client-1",
    name: "John Athlete",
    email: "athlete@admino.app",
    role: "CLIENT",
    orgId: "org-demo-1",
  },
};

export const MOCK_TOKENS: Record<UserRole, string> = {
  SYSTEM_ADMIN: "mock-token-admin",
  ORGANIZATION: "mock-token-org",
  CLIENT: "mock-token-client",
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  simulateLogin: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,
      _hasHydrated: false,
      setHasHydrated: (hydrated) =>
        set({ _hasHydrated: hydrated, isInitialized: hydrated }),
      login: async (credentials) => {
        const session: AuthSession = await authService.login(credentials);
        set({
          user: session.user,
          token: session.token,
          isAuthenticated: true,
          isInitialized: true,
        });
      },
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitialized: true,
        }),
      simulateLogin: (role) =>
        set({
          user: MOCK_USERS[role],
          token: MOCK_TOKENS[role],
          isAuthenticated: true,
          isInitialized: true,
        }),
      switchRole: (role) =>
        set({
          user: MOCK_USERS[role],
          token: MOCK_TOKENS[role],
          isAuthenticated: true,
        }),
    }),
    {
      name: "auth-storage",
      storage,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
