import "@/shared/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SplashOverlay } from "@/shared/components/SplashOverlay";
import { useAppLifecycle } from "@/shared/hooks/useAppLifecycle";
import { useOrgTheme } from "@/shared/theme/useOrgTheme";

const queryClient = new QueryClient();

function AppContent() {
  const { showSplash } = useAppLifecycle();
  const { primaryColor, orgName } = useOrgTheme();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <SplashOverlay visible={showSplash} primaryColor={primaryColor} orgName={orgName} />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppContent />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
