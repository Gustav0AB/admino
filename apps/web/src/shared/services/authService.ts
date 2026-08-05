import { ENV } from "@/shared/config/env";
import { MOCK_USERS, MOCK_TOKENS } from "@/shared/store/authStore";
import type { AuthSession, LoginCredentials, UserRole } from "@/shared/types/auth";

const MOCK_CREDENTIALS: Record<string, keyof typeof MOCK_USERS> = {
  "admin@admino.app": "SYSTEM_ADMIN",
  "coach@admino.app": "OWNER",
  "manager@admino.app": "ADMIN",
  "athlete@admino.app": "MEMBER",
};

async function mockLogin(credentials: LoginCredentials): Promise<AuthSession> {
  await new Promise((r) => setTimeout(r, 500));
  const role = MOCK_CREDENTIALS[credentials.username];
  if (!role) {
    throw new Error("Credenciales inválidas");
  }
  return {
    user: MOCK_USERS[role],
    token: MOCK_TOKENS[role],
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  };
}

async function realLogin(credentials: LoginCredentials): Promise<AuthSession> {
  const res = await fetch(`${ENV.API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? "No se pudo iniciar sesión");
  }
  const envelope = await res.json() as {
    data: {
      token: string;
      expiresAt: number;
      user: { sub: string; username: string; role: UserRole; orgId: string | null; name?: string };
    };
  };
  const { token, user: u, expiresAt } = envelope.data;
  return {
    token,
    expiresAt: expiresAt ?? null,
    user: {
      id: u.sub,
      name: u.name ?? u.username,
      username: u.username,
      role: u.role,
      orgId: u.orgId,
    },
  };
}

async function realForgotPassword(username: string): Promise<{ message: string }> {
  const res = await fetch(`${ENV.API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message ?? "No se pudo enviar la solicitud");
  return (body as { data: { message: string } }).data;
}

async function realResetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const res = await fetch(`${ENV.API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message ?? "No se pudo restablecer la contraseña");
  return (body as { data: { message: string } }).data;
}

async function realRefresh(token: string): Promise<{ token: string; expiresAt: number }> {
  const res = await fetch(`${ENV.API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("No se pudo renovar la sesión");
  const envelope = await res.json() as { data: { token: string; expiresAt: number } };
  return envelope.data;
}

export const authService = {
  login: (credentials: LoginCredentials): Promise<AuthSession> =>
    ENV.USE_MOCK ? mockLogin(credentials) : realLogin(credentials),
  refresh: (token: string): Promise<{ token: string; expiresAt: number }> =>
    ENV.USE_MOCK
      ? Promise.resolve({ token, expiresAt: Math.floor(Date.now() / 1000) + 3600 })
      : realRefresh(token),
  forgotPassword: (username: string): Promise<{ message: string }> =>
    ENV.USE_MOCK
      ? Promise.resolve({ message: "Si el usuario existe, se envió un correo con instrucciones." })
      : realForgotPassword(username),
  resetPassword: (token: string, newPassword: string): Promise<{ message: string }> =>
    ENV.USE_MOCK
      ? Promise.resolve({ message: "Contraseña actualizada" })
      : realResetPassword(token, newPassword),
};
