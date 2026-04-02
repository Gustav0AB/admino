import { useTranslation } from "react-i18next";
import { YStack, Text, Button, XStack, Switch, Label } from "tamagui";
import { useAuthStore } from "@/shared/store/authStore";
import { useThemeStore } from "@/shared/store/themeStore";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const clearToken = useAuthStore((s) => s.clearToken);
  const { mode, toggle } = useThemeStore();

  const handleSignOut = () => {
    clearToken();
    router.replace("/(auth)/sign-in");
  };

  return (
    <YStack flex={1} padding="$6" gap="$6">
      <Text fontSize="$9" fontWeight="800">
        {t("planning.title")}
      </Text>
      <Text fontSize="$5">
        {t("entities.client_plural")}
      </Text>
      <XStack alignItems="center" gap="$3">
        <Label htmlFor="theme-toggle">Dark Mode</Label>
        <Switch
          id="theme-toggle"
          checked={mode === "dark"}
          onCheckedChange={toggle}
        >
          <Switch.Thumb animation="bouncy" />
        </Switch>
      </XStack>
      <Button onPress={handleSignOut} theme="red">
        {t("auth.signOut")}
      </Button>
    </YStack>
  );
}
