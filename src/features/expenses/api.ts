import { httpClient } from "@/shared/api/client";
import type { AppData } from "./types";

export const expensesApi = {
  get: () => httpClient<{ data: AppData | Record<string, never> }>("/expenses"),
  put: (data: AppData) =>
    httpClient<{ data: AppData }>("/expenses", { method: "PUT", body: data }),
};
