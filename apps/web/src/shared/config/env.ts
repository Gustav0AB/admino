type ApiMode = "MOCK" | "LIVE";

const bool = (val: string | undefined, fallback: boolean): boolean => {
  if (val === undefined) return fallback;
  return val === "true";
};

const resolveApiMode = (): ApiMode => {
  const explicit = import.meta.env.VITE_API_MODE;
  if (explicit === "LIVE") return "LIVE";
  if (explicit === "MOCK") return "MOCK";
  return bool(import.meta.env.VITE_USE_MOCK, false) ? "MOCK" : "LIVE";
};

const API_MODE = resolveApiMode();

export const ENV = {
  API_URL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1",
  USE_MOCK: API_MODE === "MOCK",
} as const;
