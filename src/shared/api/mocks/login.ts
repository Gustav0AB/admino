import type { AuthSession } from "@/shared/types/auth";
import type { ApiResponse } from "@/shared/types/api";

export const mockLogin: ApiResponse<AuthSession> = {
  status: 200,
  message: "Login successful",
  data: {
    token: "mock-token-client",
    user: {
      id: "mock-client-1",
      name: "John Athlete",
      email: "athlete@admino.app",
      role: "CLIENT",
      orgId: "org-demo-1",
    },
  },
};
