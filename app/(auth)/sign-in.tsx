import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/shared/hooks/useAuth";
import { useColors } from "@/shared/hooks/useColors";
import { useOrgTheme } from "@/shared/theme/useOrgTheme";

export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const c = useColors();
  const { primaryColor } = useOrgTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      router.replace("/(drawer)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.background,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <Text style={[styles.title, { color: c.text }]}>{t("auth.signIn")}</Text>
      <TextInput
        style={[styles.input, { borderColor: c.border, backgroundColor: c.background, color: c.text }]}
        placeholder={t("auth.email")}
        placeholderTextColor={c.textPlaceholder}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { borderColor: c.border, backgroundColor: c.background, color: c.text }]}
        placeholder={t("auth.password")}
        placeholderTextColor={c.textPlaceholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error !== null && (
        <Text style={[styles.errorText, { color: c.textMuted }]}>{error}</Text>
      )}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]}
        onPress={handleSignIn}
        activeOpacity={0.85}
        accessibilityRole="button"
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{t("auth.signIn")}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 16 },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8 },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  errorText: { fontSize: 13, marginTop: -8 },
  button: {
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
