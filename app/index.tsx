import { Redirect } from "expo-router";
import { useAuth } from "@/shared/hooks/useAuth";

export default function Index() {
  const { isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) return null;

  return <Redirect href={isAuthenticated ? "/(drawer)" : "/(auth)/sign-in"} />;
}
