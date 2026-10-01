export type UserRole = "SYSTEM_ADMIN" | "OWNER" | "ADMIN" | "MEMBER";

export type User = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  orgId: string | null;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type AuthSession = {
  user: User;
  token: string;
  expiresAt: number | null;
};
