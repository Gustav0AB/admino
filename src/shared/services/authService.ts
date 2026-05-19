import { ENV } from "@/shared/config/env";
import { MOCK_USERS, MOCK_TOKENS } from "@/shared/store/authStore";
import type { AuthSession, LoginCredentials, UserRole } from "@/shared/types/auth";

const MOCK_CREDENTIALS: Record<string, keyof typeof MOCK_USERS> = {
  "admin@admino.app": "SYSTEM_ADMIN",
  "coach@admino.app": "OWNER",
  "athlete@admino.app": "MEMBER",
};

async function mockLogin(credentials: LoginCredentials): Promise<AuthSession> {
  await new Promise((r) => setTimeout(r, 500));
  const role = MOCK_CREDENTIALS[credentials.username];
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
  const envelope = await res.json() as { data: { token: string; user: { sub: string; username: string; role: UserRole; orgId: string | null; name?: string } } };
  const { token, user: u } = envelope.data;
  return {
    token,
    user: {
      id: u.sub,
      name: u.name ?? u.username,
      username: u.username,
      role: u.role,
      orgId: u.orgId,
    },
  };
}

export const authService = {
  login: (credentials: LoginCredentials): Promise<AuthSession> =>
    ENV.USE_MOCK ? mockLogin(credentials) : realLogin(credentials),
};
