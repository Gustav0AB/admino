import { httpClient } from "@/shared/api/client";
import type { AppData } from "./types";

export const expensesApi = {
  get: () => httpClient<AppData | Record<string, never>>("/api/v1/expenses"),
  put: (data: AppData) =>
    httpClient<AppData>("/api/v1/expenses", { method: "PUT", body: data }),
};
