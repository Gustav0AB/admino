type ApiMode = "MOCK" | "LIVE";

const bool = (val: string | undefined, fallback: boolean): boolean => {
  if (val === undefined) return fallback;
  return val === "true";
};

const resolveApiMode = (): ApiMode => {
  const explicit = process.env.EXPO_PUBLIC_API_MODE;
  if (explicit === "LIVE") return "LIVE";
  if (explicit === "MOCK") return "MOCK";
  return bool(process.env.EXPO_PUBLIC_USE_MOCK, true) ? "MOCK" : "LIVE";
};

const API_MODE = resolveApiMode();

export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
  API_MODE,
  USE_MOCK: API_MODE === "MOCK",
  VERSION: process.env.EXPO_PUBLIC_VERSION ?? "1.0.0",
} as const;
