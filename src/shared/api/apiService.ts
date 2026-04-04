import { ENV } from "@/shared/config/env";
import { httpClient, type RequestOptions } from "@/shared/api/client";

const MOCK_DELAY_MS = 1000;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function apiService<T>(
  endpoint: string,
  mockData: T,
  options?: RequestOptions
): Promise<T> {
  if (ENV.USE_MOCK) {
    await delay(MOCK_DELAY_MS);
    return mockData;
  }

  return httpClient<T>(endpoint, options);
}
