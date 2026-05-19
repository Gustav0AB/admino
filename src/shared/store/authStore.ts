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
    username: "admin@admino.app",
    role: "SYSTEM_ADMIN",
    orgId: null,
  },
  OWNER: {
    id: "mock-org-1",
    name: "Sam Coach",
    username: "coach@admino.app",
    role: "OWNER",
    orgId: "org-demo-1",
  },
  ADMIN: {
    id: "mock-org-2",
    name: "Pat Manager",
    username: "manager@admino.app",
    role: "ADMIN",
    orgId: "org-demo-1",
  },
  MEMBER: {
    id: "mock-client-1",
    name: "John Athlete",
    username: "athlete@admino.app",
    role: "MEMBER",
    orgId: "org-demo-1",
  },
};

export const MOCK_TOKENS: Record<UserRole, string> = {
  SYSTEM_ADMIN: "mock-token-admin",
  OWNER: "mock-token-owner",
  ADMIN: "mock-token-admin-member",
  MEMBER: "mock-token-member",
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
        if (state?.user && !state.user.role) {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
        state?.setHasHydrated(true);
      },
    }
  )
);
