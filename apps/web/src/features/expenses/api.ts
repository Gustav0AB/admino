import { httpClient } from "@/shared/api/client";
import { ENV } from "@/shared/config/env";
import type { AppData } from "./types";

export const expensesApi = {
  get: () =>
    ENV.USE_MOCK
      ? Promise.resolve({ data: {} })
      : httpClient<AppData | Record<string, never>>("/expenses").then((data) => ({ data })),
  put: (data: AppData) =>
    ENV.USE_MOCK
      ? Promise.resolve({ data })
      : httpClient<AppData>("/expenses", { method: "PUT", body: data }).then((data) => ({ data })),
};
