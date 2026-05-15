import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import type { CompetitionEvent } from "../types";
import { EventCard } from "./EventCard";
import dayjs from "dayjs";

type CalendarListProps = {
  events: CompetitionEvent[];
  onLogBiometrics: (event: CompetitionEvent) => void;
};

type GroupedEvents = { label: string; data: CompetitionEvent[] }[];

function groupByMonth(events: CompetitionEvent[]): GroupedEvents {
  const map = new Map<string, CompetitionEvent[]>();
  const sorted = [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  for (const evt of sorted) {
    const key = dayjs(evt.startDate).format("MMMM YYYY");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(evt);
  }
  return Array.from(map.entries()).map(([label, data]) => ({ label, data }));
}

export function CalendarList({ events, onLogBiometrics }: CalendarListProps) {
  const { t } = useTranslation();
  const c = useColors();
  const groups = groupByMonth(events);

  if (events.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: c.backgroundStrong }]}>
        <Text style={[styles.emptyText, { color: c.textMuted }]}>
          {t("events.noEvents")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {groups.map((group) => (
        <View key={group.label} style={styles.group}>
          <Text style={[styles.groupLabel, { color: c.textMuted, borderBottomColor: c.border }]}>
            {group.label}
          </Text>
          {group.data.map((evt) => (
            <EventCard
              key={evt.id}
              event={evt}
              onLogBiometrics={onLogBiometrics}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.lg,
  },
  group: {
    gap: SPACING.sm,
  },
  groupLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingBottom: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.xs,
  },
  empty: {
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: "center",
  },
});
