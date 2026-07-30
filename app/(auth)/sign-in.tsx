import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/shared/hooks/useAuth";
import { useColors } from "@/shared/hooks/useColors";
import { useClientTheme } from "@/shared/theme/useClientTheme";
import { FONTS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

const isWeb = Platform.OS === "web";
const WEB_DESKTOP_BREAKPOINT = 768;

export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const c = useColors();
  const { primaryColor, orgName } = useClientTheme();
  const { width } = useWindowDimensions();
  const isWebDesktop = isWeb && width >= WEB_DESKTOP_BREAKPOINT;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await login({ username, password });
      router.replace("/(drawer)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (isWeb && !isWebDesktop) {
    // Web mobile: single-column centered form, no side panel
    return (
      <ScrollView
        contentContainerStyle={[
          webMobileStyles.container,
          { backgroundColor: c.background, paddingTop: 48, paddingBottom: 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={webMobileStyles.header}>
          <View style={[webMobileStyles.logoMark, { backgroundColor: primaryColor }]}>
            <Text style={webMobileStyles.logoMarkText}>
              {orgName ? orgName.charAt(0).toUpperCase() : "A"}
            </Text>
          </View>
          <Text style={[webMobileStyles.title, { color: c.text, fontFamily: FONTS.heading.bold }]}>
            Welcome back
          </Text>
          <Text style={[webMobileStyles.subtitle, { color: c.textMuted }]}>
            Sign in to {orgName ?? "your account"}
          </Text>
        </View>

        <View style={[webMobileStyles.card, { backgroundColor: c.background, borderColor: c.border }]}>
          <View style={webMobileStyles.fieldGroup}>
            <Text style={[webMobileStyles.label, { color: c.textMuted }]}>
              {t("auth.email")}
            </Text>
            <TextInput
              style={[
                webMobileStyles.input,
                {
                  borderColor: focusedField === "email" ? primaryColor : c.border,
                  backgroundColor: c.backgroundStrong,
                  color: c.text,
                  // @ts-ignore
                  outline: "none",
                },
              ]}
              placeholder="your_username"
              placeholderTextColor={c.textPlaceholder}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={webMobileStyles.fieldGroup}>
            <View style={webMobileStyles.labelRow}>
              <Text style={[webMobileStyles.label, { color: c.textMuted }]}>
                {t("auth.password")}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password" as any)}>
                <Text style={[webMobileStyles.forgotLink, { color: primaryColor }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                webMobileStyles.input,
                {
                  borderColor: focusedField === "password" ? primaryColor : c.border,
                  backgroundColor: c.backgroundStrong,
                  color: c.text,
                  // @ts-ignore
                  outline: "none",
                },
              ]}
              placeholder="••••••••"
              placeholderTextColor={c.textPlaceholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {error !== null && (
            <View style={[webMobileStyles.errorBanner, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
              <Text style={[webMobileStyles.errorText, { color: "#B91C1C" }]}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[webMobileStyles.button, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSignIn}
            activeOpacity={0.85}
            accessibilityRole="button"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={webMobileStyles.buttonText}>{t("auth.signIn")}</Text>
            )}
          </TouchableOpacity>

          <Text style={[webMobileStyles.footerText, { color: c.textMuted }]}>
            By signing in, you agree to our{" "}
            <Text style={{ color: primaryColor }}>Terms of Service</Text>
            {" "}and{" "}
            <Text style={{ color: primaryColor }}>Privacy Policy</Text>.
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (isWebDesktop) {
    return (
      <View style={[webStyles.root, { backgroundColor: c.backgroundStrong }]}>
        {/* Left branding panel */}
        <View style={[webStyles.panel, { backgroundColor: primaryColor }]}>
          <View style={webStyles.panelContent}>
            <View style={webStyles.logoMark}>
              <Text style={webStyles.logoMarkText}>
                {orgName ? orgName.charAt(0).toUpperCase() : "A"}
              </Text>
            </View>
            <Text style={webStyles.panelOrg}>{orgName ?? "Admino"}</Text>
            <Text style={webStyles.panelTagline}>
              Your all-in-one admin platform
            </Text>
            <View style={webStyles.panelDots}>
              <View style={[webStyles.dot, { opacity: 1 }]} />
              <View style={[webStyles.dot, { opacity: 0.4 }]} />
              <View style={[webStyles.dot, { opacity: 0.4 }]} />
            </View>
          </View>
        </View>

        {/* Right form panel */}
        <ScrollView
          contentContainerStyle={webStyles.formScroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[webStyles.card, { backgroundColor: c.background, borderColor: c.border }]}>
            <Text style={[webStyles.cardTitle, { color: c.text, fontFamily: FONTS.heading.bold }]}>
              Welcome back
            </Text>
            <Text style={[webStyles.cardSubtitle, { color: c.textMuted }]}>
              Sign in to your account to continue
            </Text>

            <View style={webStyles.fieldGroup}>
              <Text style={[webStyles.label, { color: c.textMuted }]}>
                {t("auth.email")}
              </Text>
              <TextInput
                style={[
                  webStyles.input,
                  {
                    borderColor: focusedField === "email" ? primaryColor : c.border,
                    backgroundColor: c.background,
                    color: c.text,
                  },
                ]}
                placeholder="your_username"
                placeholderTextColor={c.textPlaceholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={webStyles.fieldGroup}>
              <View style={webStyles.labelRow}>
                <Text style={[webStyles.label, { color: c.textMuted }]}>
                  {t("auth.password")}
                </Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password" as any)}>
                  <Text style={[webStyles.forgotLink, { color: primaryColor }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  webStyles.input,
                  {
                    borderColor: focusedField === "password" ? primaryColor : c.border,
                    backgroundColor: c.background,
                    color: c.text,
                  },
                ]}
                placeholder="••••••••"
                placeholderTextColor={c.textPlaceholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {error !== null && (
              <View style={[webStyles.errorBanner, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
                <Text style={[webStyles.errorText, { color: "#B91C1C" }]}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[webStyles.button, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]}
              onPress={handleSignIn}
              activeOpacity={0.85}
              accessibilityRole="button"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={webStyles.buttonText}>{t("auth.signIn")}</Text>
              )}
            </TouchableOpacity>

            <Text style={[webStyles.footerText, { color: c.textMuted }]}>
              By signing in, you agree to our{" "}
              <Text style={{ color: primaryColor }}>Terms of Service</Text>
              {" "}and{" "}
              <Text style={{ color: primaryColor }}>Privacy Policy</Text>.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Mobile layout
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          mobileStyles.container,
          {
            backgroundColor: c.background,
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={mobileStyles.header}>
          <View style={[mobileStyles.logoMark, { backgroundColor: primaryColor }]}>
            <Text style={mobileStyles.logoMarkText}>
              {orgName ? orgName.charAt(0).toUpperCase() : "A"}
            </Text>
          </View>
          <Text style={[mobileStyles.title, { color: c.text, fontFamily: FONTS.heading.bold }]}>
            Welcome back
          </Text>
          <Text style={[mobileStyles.subtitle, { color: c.textMuted }]}>
            Sign in to {orgName ?? "your account"}
          </Text>
        </View>

        <View style={mobileStyles.form}>
          <View style={mobileStyles.fieldGroup}>
            <Text style={[mobileStyles.label, { color: c.textMuted }]}>
              {t("auth.email")}
            </Text>
            <TextInput
              style={[
                mobileStyles.input,
                {
                  borderColor: focusedField === "email" ? primaryColor : c.border,
                  backgroundColor: c.backgroundStrong,
                  color: c.text,
                },
              ]}
              placeholder="your_username"
              placeholderTextColor={c.textPlaceholder}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={mobileStyles.fieldGroup}>
            <View style={mobileStyles.labelRow}>
              <Text style={[mobileStyles.label, { color: c.textMuted }]}>
                {t("auth.password")}
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password" as any)}>
                <Text style={[mobileStyles.forgotLink, { color: primaryColor }]}>
                  Forgot?
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                mobileStyles.input,
                {
                  borderColor: focusedField === "password" ? primaryColor : c.border,
                  backgroundColor: c.backgroundStrong,
                  color: c.text,
                },
              ]}
              placeholder="••••••••"
              placeholderTextColor={c.textPlaceholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {error !== null && (
            <View style={[mobileStyles.errorBanner, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
              <Text style={[mobileStyles.errorText, { color: "#B91C1C" }]}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[mobileStyles.button, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSignIn}
            activeOpacity={0.85}
            accessibilityRole="button"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={mobileStyles.buttonText}>{t("auth.signIn")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const webMobileStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xl,
  },
  header: {
    alignItems: "center",
    gap: SPACING.sm,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.xl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  logoMarkText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  card: {
    width: "100%" as any,
    maxWidth: 420,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.xl,
    gap: SPACING.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  fieldGroup: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
  },
  button: {
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xs,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "600",
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: "center",
    lineHeight: 18,
  },
});

const webStyles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    minHeight: "100%" as any,
  },
  panel: {
    width: "40%" as any,
    minHeight: "100%" as any,
    justifyContent: "center",
    alignItems: "center",
  },
  panelContent: {
    alignItems: "center",
    gap: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  logoMarkText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  panelOrg: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  panelTagline: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 24,
  },
  panelDots: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  formScroll: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  card: {
    width: "100%" as any,
    maxWidth: 420,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.xxl,
    gap: SPACING.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginTop: -SPACING.sm,
  },
  fieldGroup: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
  },
  input: {
    height: 44,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    // @ts-ignore — valid on web, suppresses browser focus ring (border handles focus state)
    outline: "none",
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
  },
  button: {
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xs,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "600",
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: "center",
    lineHeight: 18,
  },
});

const mobileStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xl,
  },
  header: {
    alignItems: "center",
    gap: SPACING.sm,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.xl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  logoMarkText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  form: {
    gap: SPACING.md,
  },
  fieldGroup: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
  },
  button: {
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xs,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "600",
  },
});
