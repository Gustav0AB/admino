import "../checkin/tasks/geofenceTask";

import { View, Text, StyleSheet } from "react-native";
import { MainLayout } from "@/shared/components/MainLayout";
import { useColors } from "@/shared/hooks/useColors";
import { useAuthStore } from "@/shared/store/authStore";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { AthleteAlarmView } from "./components/AthleteAlarmView";
import { CoachDashboard } from "./components/CoachDashboard";

export function CheckinScreen() {
  const c = useColors();
  const user = useAuthStore((s) => s.user);
  const isCoach = user?.role === "ORGANIZATION" || user?.role === "SYSTEM_ADMIN";

  return (
    <MainLayout scrollable padding={false}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>
          {isCoach ? "Athlete Check-in" : "Training Alarm"}
        </Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>
          {isCoach
            ? "Monitor athlete arrivals and manage alarms"
            : "Automatic gym detection & training notifications"}
        </Text>
      </View>

      <View style={styles.content}>
        {isCoach ? <CoachDashboard /> : <AthleteAlarmView />}
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  content: {
    padding: SPACING.md,
  },
});
