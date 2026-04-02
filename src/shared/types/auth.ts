export type UserRole = "SYSTEM_ADMIN" | "ORGANIZATION" | "CLIENT";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};
