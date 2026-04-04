import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "admino",
  slug: "admino",
  version: process.env.EXPO_PUBLIC_VERSION ?? "1.0.0",
  scheme: "admino",
  web: {
    bundler: "metro",
  },
  plugins: ["expo-router", "expo-secure-store"],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
    useMock: process.env.EXPO_PUBLIC_USE_MOCK ?? "true",
    version: process.env.EXPO_PUBLIC_VERSION ?? "1.0.0",
  },
});
