import "@/shared/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  InstrumentSans_400Regular,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from "@expo-google-fonts/instrument-sans";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { SplashOverlay } from "@/shared/components/SplashOverlay";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { ToastProvider } from "@/shared/components/feedback/Toast";
import { OfflineBanner } from "@/shared/components/OfflineBanner";
import { useAppLifecycle } from "@/shared/hooks/useAppLifecycle";
import { useOrgTheme } from "@/shared/theme/useOrgTheme";

const queryClient = new QueryClient();

function AppContent() {
  useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { showSplash } = useAppLifecycle();
  const { primaryColor, orgName } = useOrgTheme();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <OfflineBanner />
      <SplashOverlay visible={showSplash} primaryColor={primaryColor} orgName={orgName} />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ToastProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </ToastProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
