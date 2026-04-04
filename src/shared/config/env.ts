const bool = (val: string | undefined, fallback: boolean): boolean => {
  if (val === undefined) return fallback;
  return val === "true";
};

export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
  USE_MOCK: bool(process.env.EXPO_PUBLIC_USE_MOCK, true),
  VERSION: process.env.EXPO_PUBLIC_VERSION ?? "1.0.0",
} as const;
