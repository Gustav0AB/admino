import { View, Text, StyleSheet, Linking, Platform } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import type { CheckinState } from "../store/checkinStore";

type PermissionLevel = CheckinState["locationPermission"];

type PermissionGateProps = {
  permission: PermissionLevel;
  onRequest: () => void;
};

export function PermissionGate({ permission, onRequest }: PermissionGateProps) {
  const c = useColors();

  if (Platform.OS === "web") {
    return (
      <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
        <Text style={styles.icon}>📍</Text>
        <Text style={[styles.title, { color: c.text }]}>Location unavailable</Text>
        <Text style={[styles.body, { color: c.textMuted }]}>
          Geofencing is not supported in the web app. Use the mobile app for the
          full training alarm experience.
        </Text>
      </View>
    );
  }

  if (permission === "denied") {
    return (
      <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
        <Text style={styles.icon}>🚫</Text>
        <Text style={[styles.title, { color: c.text }]}>Location access denied</Text>
        <Text style={[styles.body, { color: c.textMuted }]}>
          Please enable location access in your device settings to use the
          training alarm feature.
        </Text>
        <CustomButton
          variant="outline"
          size="sm"
          onPress={() => Linking.openSettings()}
        >
          Open Settings
        </CustomButton>
      </View>
    );
  }

  if (permission === "foreground") {
    return (
      <View style={[styles.card, { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }]}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={[styles.title, { color: "#92400E" }]}>
          Background location needed
        </Text>
        <Text style={[styles.body, { color: "#78350F" }]}>
          For the geofence to work when the app is closed, grant{" "}
          <Text style={{ fontWeight: "700" }}>"Allow all the time"</Text> in
          location settings.
        </Text>
        <CustomButton
          variant="primary"
          size="sm"
          onPress={() => Linking.openSettings()}
        >
          Grant Background Access
        </CustomButton>
      </View>
    );
  }

  if (permission === "undetermined") {
    return (
      <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
        <Text style={styles.icon}>📍</Text>
        <Text style={[styles.title, { color: c.text }]}>Enable training alarm</Text>
        <Text style={[styles.body, { color: c.textMuted }]}>
          Grant location permission so the app can detect when you arrive at the
          gym and cancel your alarm automatically.
        </Text>
        <CustomButton variant="primary" size="sm" onPress={onRequest}>
          Enable Location
        </CustomButton>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.sm,
    alignItems: "center",
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: "center",
    lineHeight: 20,
  },
});
