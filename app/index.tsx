import { Redirect } from "expo-router";
import { useAuthStore } from "@/shared/store/authStore";

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return <Redirect href={isAuthenticated ? "/(drawer)" : "/(auth)/sign-in"} />;
}
