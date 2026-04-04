import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/shared/hooks/useAuth";

export default function AuthLayout() {
  const { isAuthenticated, isInitialized } = useAuth();

  if (isInitialized && isAuthenticated) {
    return <Redirect href="/(drawer)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
