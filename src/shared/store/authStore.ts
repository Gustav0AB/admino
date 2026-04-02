import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User, UserRole } from "@/shared/types/auth";

export const MOCK_USERS: Record<UserRole, User> = {
  SYSTEM_ADMIN: {
    id: "mock-admin-1",
    name: "Alex Admin",
    email: "admin@admino.app",
    role: "SYSTEM_ADMIN",
  },
  ORGANIZATION: {
    id: "mock-org-1",
    name: "Sam Coach",
    email: "coach@admino.app",
    role: "ORGANIZATION",
  },
  CLIENT: {
    id: "mock-client-1",
    name: "John Athlete",
    email: "athlete@admino.app",
    role: "CLIENT",
  },
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  signIn: (role?: UserRole) => void;
  signOut: () => void;
  switchRole: (role: UserRole) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: MOCK_USERS.CLIENT,
      isAuthenticated: true,
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      signIn: (role = "CLIENT") =>
        set({ user: MOCK_USERS[role], isAuthenticated: true }),
      signOut: () => set({ user: null, isAuthenticated: false }),
      switchRole: (role) =>
        set({ user: MOCK_USERS[role], isAuthenticated: true }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
