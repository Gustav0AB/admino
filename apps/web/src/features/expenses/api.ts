import { httpClient } from "@/shared/api/client";
import { ENV } from "@/shared/config/env";
import type { AppData } from "./types";

export const expensesApi = {
  get: () =>
    ENV.USE_MOCK
      ? Promise.resolve({ data: {} })
      : httpClient<{ data: AppData | Record<string, never> }>("/expenses"),
  put: (data: AppData) =>
    ENV.USE_MOCK
      ? Promise.resolve({ data })
      : httpClient<{ data: AppData }>("/expenses", { method: "PUT", body: data }),
};
