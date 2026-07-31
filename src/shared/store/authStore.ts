import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authService } from "@/shared/services/authService";
import type { AuthSession, LoginCredentials, User, UserRole } from "@/shared/types/auth";

function getExpensesStore() {
  try {
    return require("@/features/expenses/store").useExpensesStore;
  } catch {
    return null;
  }
}

function getPlanningStore() {
  try {
    return require("@/features/expenses/planning/store").usePlanningStore;
  } catch {
    return null;
  }
}

function getTrackerStore() {
  try {
    return require("@/shared/store/trackerStore").useTrackerStore;
  } catch {
    return null;
  }
}

const storage = createJSONStorage(() => localStorage);

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
  tokenExpiresAt: number | null; // Unix timestamp (seconds)
  isAuthenticated: boolean;
  isInitialized: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  simulateLogin: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      tokenExpiresAt: null,
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
          tokenExpiresAt: session.expiresAt,
          isAuthenticated: true,
          isInitialized: true,
        });
        const expensesStore = getExpensesStore();
        if (expensesStore) await expensesStore.getState().rehydrate();
        const planningStore = getPlanningStore();
        if (planningStore) await planningStore.getState().rehydrate();
      },
      logout: () => {
        const expensesStore = getExpensesStore();
        if (expensesStore) expensesStore.getState().clearAll();
        const planningStore = getPlanningStore();
        if (planningStore) planningStore.getState().clearAll();
        const trackerStore = getTrackerStore();
        if (trackerStore) trackerStore.getState().reset();
        set({
          user: null,
          token: null,
          tokenExpiresAt: null,
          isAuthenticated: false,
          isInitialized: true,
        });
      },
      refresh: async () => {
        const currentToken = get().token;
        if (!currentToken) throw new Error("No token");
        const result = await authService.refresh(currentToken);
        set({ token: result.token, tokenExpiresAt: result.expiresAt });
      },
      simulateLogin: (role) => {
        set({
          user: MOCK_USERS[role],
          token: MOCK_TOKENS[role],
          tokenExpiresAt: Math.floor(Date.now() / 1000) + 3600,
          isAuthenticated: true,
          isInitialized: true,
        });
        const expensesStore = getExpensesStore();
        if (expensesStore) expensesStore.getState().rehydrate().catch(() => {});
      },
      switchRole: (role) =>
        set({
          user: MOCK_USERS[role],
          token: MOCK_TOKENS[role],
          tokenExpiresAt: Math.floor(Date.now() / 1000) + 3600,
          isAuthenticated: true,
        }),
    }),
    {
      name: "auth-storage",
      storage,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.user && !state.user.role) {
          state.user = null;
          state.token = null;
          state.tokenExpiresAt = null;
          state.isAuthenticated = false;
        }
        state?.setHasHydrated(true);
      },
    }
  )
);
