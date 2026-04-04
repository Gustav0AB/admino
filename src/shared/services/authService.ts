import { ENV } from "@/shared/config/env";
import { MOCK_USERS, MOCK_TOKENS } from "@/shared/store/authStore";
import type { AuthSession, LoginCredentials } from "@/shared/types/auth";

const MOCK_CREDENTIALS: Record<string, keyof typeof MOCK_USERS> = {
  "admin@admino.app": "SYSTEM_ADMIN",
  "coach@admino.app": "ORGANIZATION",
  "athlete@admino.app": "CLIENT",
};

async function mockLogin(credentials: LoginCredentials): Promise<AuthSession> {
  await new Promise((r) => setTimeout(r, 500));
  const role = MOCK_CREDENTIALS[credentials.email];
  if (!role) {
    throw new Error("Invalid credentials");
  }
  return { user: MOCK_USERS[role], token: MOCK_TOKENS[role] };
}

async function realLogin(credentials: LoginCredentials): Promise<AuthSession> {
  const res = await fetch(`${ENV.API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? "Login failed");
  }
  return res.json() as Promise<AuthSession>;
}

export const authService = {
  login: (credentials: LoginCredentials): Promise<AuthSession> =>
    ENV.USE_MOCK ? mockLogin(credentials) : realLogin(credentials),
};
