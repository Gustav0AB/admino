import type { AuthSession } from "@/shared/types/auth";
import type { ApiResponse } from "@/shared/types/api";

export const mockLogin: ApiResponse<AuthSession> = {
  status: 200,
  message: "Login successful",
  data: {
    token: "mock-token-client",
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: "mock-client-1",
      name: "John Athlete",
      username: "athlete@admino.app",
      role: "MEMBER",
      orgId: "org-demo-1",
    },
  },
};
