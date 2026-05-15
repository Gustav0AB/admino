import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import type { CompetitionEvent } from "../types";
import {
  getCalendarDays,
  eventsForDay,
  isToday,
  EVENT_TYPE_COLORS,
} from "../utils/eventUtils";
import dayjs from "dayjs";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarGridProps = {
  events: CompetitionEvent[];
  onLogBiometrics: (event: CompetitionEvent) => void;
};

export function CalendarGrid({ events, onLogBiometrics }: CalendarGridProps) {
  const { t } = useTranslation();
  const c = useColors();
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = getCalendarDays(year, month);
  const monthLabel = dayjs(viewDate).format("MMMM YYYY");

  function prevMonth() {
    setViewDate((d) => dayjs(d).subtract(1, "month").toDate());
  }
  function nextMonth() {
    setViewDate((d) => dayjs(d).add(1, "month").toDate());
  }

  return (
    <View style={[styles.container, { borderColor: c.border }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity
          onPress={prevMonth}
          style={styles.navBtn}
          accessibilityLabel={t("events.prevMonth")}
          accessibilityRole="button"
        >
          <Text style={[styles.navIcon, { color: c.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: c.text }]}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={nextMonth}
          style={styles.navBtn}
          accessibilityLabel={t("events.nextMonth")}
          accessibilityRole="button"
        >
          <Text style={[styles.navIcon, { color: c.text }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((d) => (
          <View key={d} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, { color: c.textMuted }]}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} style={[styles.cell, { borderColor: c.border }]} />;
          }
          const dayEvents = eventsForDay(events, year, month, day);
          const today = isToday(year, month, day);
          const visible = dayEvents.slice(0, 2);
          const overflow = dayEvents.length - visible.length;

          return (
            <View
              key={`day-${day}`}
              style={[
                styles.cell,
                { borderColor: c.border },
                today && { backgroundColor: c.backgroundStrong },
              ]}
            >
              <View style={styles.dayHeader}>
                <View
                  style={[
                    styles.dayNumber,
                    today && { backgroundColor: c.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: today ? c.primaryForeground : c.text },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              </View>

              <View style={styles.eventChips}>
                {visible.map((evt) => (
                  <Pressable
                    key={evt.id}
                    onPress={() => onLogBiometrics(evt)}
                    style={[
                      styles.chip,
                      { backgroundColor: EVENT_TYPE_COLORS[evt.type] + "22" },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={evt.title}
                  >
                    <View
                      style={[
                        styles.chipDot,
                        { backgroundColor: EVENT_TYPE_COLORS[evt.type] },
                      ]}
                    />
                    <Text
                      style={[styles.chipText, { color: EVENT_TYPE_COLORS[evt.type] }]}
                      numberOfLines={1}
                    >
                      {evt.title}
                    </Text>
                  </Pressable>
                ))}
                {overflow > 0 && (
                  <Text style={[styles.overflowText, { color: c.textMuted }]}>
                    +{overflow} more
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monthLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "700",
  },
  navBtn: {
    padding: SPACING.sm,
  },
  navIcon: {
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 24,
  },
  weekdayRow: {
    flexDirection: "row",
  },
  weekdayCell: {
    flex: 1,
    paddingVertical: SPACING.xs,
    alignItems: "center",
  },
  weekdayText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "14.285714%",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 90,
    padding: SPACING.xs,
  },
  dayHeader: {
    alignItems: "flex-end",
    marginBottom: SPACING.xs,
  },
  dayNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
  },
  eventChips: {
    gap: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 4,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  chipText: {
    fontSize: 10,
    fontWeight: "600",
    flexShrink: 1,
  },
  overflowText: {
    fontSize: 10,
    paddingHorizontal: 4,
  },
});
