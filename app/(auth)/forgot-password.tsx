import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/shared/hooks/useColors";
import { useClientTheme } from "@/shared/theme/useClientTheme";
import { authService } from "@/shared/services/authService";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const c = useColors();
  const { primaryColor } = useClientTheme();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await authService.forgotPassword(username.trim());
      setMessage(res.message);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.background }]} keyboardShouldPersistTaps="handled">
      <View style={[styles.card, { backgroundColor: c.background, borderColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>Restablecer contraseña</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>
          Ingresa tu usuario o email y te enviaremos instrucciones para crear una nueva contraseña.
        </Text>

        {message ? (
          <>
            <Text style={[styles.message, { color: c.text }]}>{message}</Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/sign-in")}>
              <Text style={[styles.link, { color: primaryColor }]}>Volver a iniciar sesión</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Usuario o email"
              placeholderTextColor={c.textPlaceholder}
              autoCapitalize="none"
              style={[styles.input, { borderColor: c.border, backgroundColor: c.backgroundStrong, color: c.text }]}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: primaryColor, opacity: loading || !username.trim() ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={loading || !username.trim()}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar instrucciones</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.link, { color: primaryColor }]}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: SPACING.lg },
  card: { width: "100%", maxWidth: 420, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, padding: SPACING.xl, gap: SPACING.md },
  title: { fontSize: TYPOGRAPHY.fontSize.xxl, fontWeight: "700" },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.sm, lineHeight: 20 },
  message: { fontSize: TYPOGRAPHY.fontSize.md, lineHeight: 22 },
  input: { height: 48, borderWidth: 1.5, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, fontSize: TYPOGRAPHY.fontSize.md },
  button: { height: 48, borderRadius: BORDER_RADIUS.md, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#fff", fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "600" },
  link: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "500", textAlign: "center", marginTop: SPACING.xs },
});
