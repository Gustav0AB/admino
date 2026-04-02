import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { useAuth } from "@/shared/hooks/useAuth";
import type { UserRole } from "@/shared/types/auth";

const ROLES: UserRole[] = ["SYSTEM_ADMIN", "ORGANIZATION", "CLIENT"];
const ROLE_LABELS: Record<UserRole, string> = {
  SYSTEM_ADMIN: "Admin",
  ORGANIZATION: "Org",
  CLIENT: "Client",
};

export function DevRoleSwitcher() {
  const c = useColors();
  const { user, switchRole } = useAuth();

  if (!__DEV__) return null;

  return (
    <View style={[styles.container, { borderTopColor: c.border }]}>
      <Text style={[styles.label, { color: c.textMuted }]}>DEV · SWITCH ROLE</Text>
      <View style={styles.row}>
        {ROLES.map((role) => {
          const isActive = user?.role === role;
          return (
            <TouchableOpacity
              key={role}
              style={[
                styles.pill,
                {
                  backgroundColor: isActive ? c.primary : c.backgroundStrong,
                  borderColor: c.border,
                },
              ]}
              onPress={() => switchRole(role)}
              accessibilityRole="button"
            >
              <Text style={[styles.pillText, { color: isActive ? "#fff" : c.textMuted }]}>
                {ROLE_LABELS[role]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, borderTopWidth: 1, gap: 8 },
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 1 },
  row: { flexDirection: "row", gap: 8 },
  pill: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: 12, fontWeight: "600" },
});
