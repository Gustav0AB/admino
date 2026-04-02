import { useTranslation } from "react-i18next";
import { YStack, Text, Button, Input } from "tamagui";
import { useAuthStore } from "@/shared/store/authStore";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = () => {
    setToken("mock-token");
    router.replace("/(app)");
  };

  return (
    <YStack flex={1} justifyContent="center" padding="$6" gap="$4">
      <Text fontSize="$8" fontWeight="700">
        {t("auth.signIn")}
      </Text>
      <Input
        placeholder={t("auth.email")}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        placeholder={t("auth.password")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button onPress={handleSignIn} theme="active">
        {t("auth.signIn")}
      </Button>
    </YStack>
  );
}
