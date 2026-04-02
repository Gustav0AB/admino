import { TamaguiProvider } from "tamagui";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import appConfig from "@/shared/config/tamagui.config";
import "@/shared/i18n";
import { useThemeStore } from "@/shared/store/themeStore";

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const themeMode = useThemeStore((s) => s.mode);
  const resolvedTheme = themeMode ?? systemScheme ?? "light";

  return (
    <TamaguiProvider config={appConfig} defaultTheme={resolvedTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </TamaguiProvider>
  );
}
