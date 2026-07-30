import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "@/shared/hooks/useColors";
import { useClientTheme } from "@/shared/theme/useClientTheme";
import { authService } from "@/shared/services/authService";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const c = useColors();
  const { primaryColor } = useClientTheme();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!token) { setError("Enlace inválido o incompleto"); return; }
    if (newPassword.length < 8) { setError("Mínimo 8 caracteres"); return; }
    if (newPassword !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }

    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.background }]} keyboardShouldPersistTaps="handled">
      <View style={[styles.card, { backgroundColor: c.background, borderColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>Crear nueva contraseña</Text>

        {done ? (
          <>
            <Text style={{ color: c.text, fontSize: TYPOGRAPHY.fontSize.md, lineHeight: 22 }}>
              Tu contraseña se actualizó correctamente.
            </Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/sign-in")}>
              <Text style={[styles.link, { color: primaryColor }]}>Ir a iniciar sesión</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nueva contraseña"
              placeholderTextColor={c.textPlaceholder}
              secureTextEntry
              style={[styles.input, { borderColor: c.border, backgroundColor: c.backgroundStrong, color: c.text }]}
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmar contraseña"
              placeholderTextColor={c.textPlaceholder}
              secureTextEntry
              style={[styles.input, { borderColor: c.border, backgroundColor: c.backgroundStrong, color: c.text }]}
            />
            {error && <Text style={{ color: "#B91C1C", fontSize: TYPOGRAPHY.fontSize.sm }}>{error}</Text>}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Guardar contraseña</Text>}
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
  input: { height: 48, borderWidth: 1.5, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, fontSize: TYPOGRAPHY.fontSize.md },
  button: { height: 48, borderRadius: BORDER_RADIUS.md, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#fff", fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "600" },
  link: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "500", textAlign: "center", marginTop: SPACING.xs },
});
