export type UserRole = "SYSTEM_ADMIN" | "ORGANIZATION" | "CLIENT";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId: string | null;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthSession = {
  user: User;
  token: string;
};
