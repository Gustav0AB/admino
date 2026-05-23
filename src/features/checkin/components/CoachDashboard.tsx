import { useCallback } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useCheckinStore } from "../store/checkinStore";
import { useCheckinSocket } from "../hooks/useCheckinSocket";
import { AlarmStatusBadge } from "./AlarmStatusBadge";
import type { AthleteAlarmInfo, EmergencyEvent } from "../types";
import dayjs from "dayjs";

const MOCK_ALARMS: AthleteAlarmInfo[] = [
  {
    athleteId: "athlete-1",
    athleteName: "John Athlete",
    status: "active",
    triggeredAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    athleteId: "athlete-2",
    athleteName: "Maria Runner",
    status: "silenced_emergency",
    triggeredAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    athleteId: "athlete-3",
    athleteName: "Carlos Swim",
    status: "silenced_arrival",
    triggeredAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

export function CoachDashboard() {
  const c = useColors();
  const { athleteAlarms, upsertAthleteAlarm } = useCheckinStore();

  const handleEmergency = useCallback(
    (event: EmergencyEvent) => {
      upsertAthleteAlarm({
        athleteId: event.athleteId,
        athleteName: event.athleteName,
        status: "silenced_emergency",
        triggeredAt: event.timestamp,
      });
    },
    [upsertAthleteAlarm]
  );

  const { emitStopAlarm } = useCheckinSocket(undefined, handleEmergency);

  const displayAlarms = athleteAlarms.length > 0 ? athleteAlarms : MOCK_ALARMS;
  const activeCount = displayAlarms.filter((a) => a.status === "active").length;
  const emergencyCount = displayAlarms.filter(
    (a) => a.status === "silenced_emergency"
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <SummaryChip
          label="Active alarms"
          value={String(activeCount)}
          color="#DC2626"
          bg="#FEE2E2"
          c={c}
        />
        <SummaryChip
          label="Emergencies"
          value={String(emergencyCount)}
          color="#D97706"
          bg="#FEF3C7"
          c={c}
        />
        <SummaryChip
          label="Arrived"
          value={String(
            displayAlarms.filter((a) => a.status === "silenced_arrival").length
          )}
          color="#059669"
          bg="#D1FAE5"
          c={c}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: c.textMuted }]}>
        Athletes ({displayAlarms.length})
      </Text>

      <FlatList
        data={displayAlarms}
        keyExtractor={(item) => item.athleteId}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        renderItem={({ item }) => (
          <AthleteAlarmCard
            info={item}
            onStopAlarm={() => {
              emitStopAlarm(item.athleteId);
              upsertAthleteAlarm({ ...item, status: "silenced_coach" });
            }}
            c={c}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: c.backgroundStrong }]}>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
              No athlete alarms active right now.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function AthleteAlarmCard({
  info,
  onStopAlarm,
  c,
}: {
  info: AthleteAlarmInfo;
  onStopAlarm: () => void;
  c: ReturnType<typeof useColors>;
}) {
  const isActive = info.status === "active";
  const isEmergency = info.status === "silenced_emergency";
  const canStop = isActive;

  return (
    <View
      style={[
        styles.card,
        { borderColor: isEmergency ? "#FCA5A5" : isActive ? "#FECACA" : c.border },
        { backgroundColor: isEmergency ? "#FFF7ED" : isActive ? "#FEF2F2" : c.backgroundStrong },
      ]}
    >
      {isEmergency && (
        <View style={styles.emergencyBanner}>
          <Text style={styles.emergencyBannerText}>🚨 LIFE EMERGENCY REPORTED</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardLeft}>
          <Text style={[styles.athleteName, { color: c.text }]}>{info.athleteName}</Text>
          {info.triggeredAt && (
            <Text style={[styles.timeText, { color: c.textMuted }]}>
              {isEmergency ? "Emergency at" : "Alarm since"}{" "}
              {dayjs(info.triggeredAt).format("HH:mm")}
            </Text>
          )}
          <AlarmStatusBadge status={info.status} />
        </View>

        {canStop && (
          <CustomButton
            variant="outline"
            size="sm"
            onPress={onStopAlarm}
            style={styles.stopBtn}
          >
            Stop Alarm
          </CustomButton>
        )}
      </View>
    </View>
  );
}

function SummaryChip({
  label,
  value,
  color,
  bg,
  c,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  summaryRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  chip: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: "center",
    gap: 2,
  },
  chipValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "800",
  },
  chipLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "600",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  card: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
  },
  emergencyBanner: {
    backgroundColor: "#DC2626",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  emergencyBannerText: {
    color: "#FFFFFF",
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "800",
    letterSpacing: 1,
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    gap: SPACING.md,
  },
  cardLeft: {
    flex: 1,
    gap: SPACING.xs,
  },
  athleteName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "700",
  },
  timeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  stopBtn: {
    flexShrink: 0,
  },
  empty: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});
