import { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { EVENT_COLORS } from "./calendarUtils";
import type { CalendarEvent, WeekRow } from "./types";

const DAY_HEADERS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const WEEK_COL_W = 52;
const DAY_COL_W = 110;
const CELL_MIN_H = 120;

type DayCellProps = {
  dayIso: string;
  dayIdx: number;
  cellText: string;
  dayEvents: CalendarEvent[];
  outOfRange: boolean;
  editable: boolean;
  isSelected: boolean;
  onCellOpenModal?: ((dateIso: string) => void) | undefined;
  onSelect: (idx: number | null) => void;
};

function DayCell({ dayIso, dayIdx, cellText, dayEvents, outOfRange, editable, isSelected, onCellOpenModal, onSelect }: DayCellProps) {
  const c = useColors();
  const canOpenModal = !outOfRange && editable && !!onCellOpenModal;

  return (
    <View
      style={[
        styles.dayCell,
        { borderRightColor: c.border },
        outOfRange && { opacity: 0.4 },
        isSelected && { backgroundColor: c.primary + "08" },
      ]}
    >
      <Pressable
        onPress={canOpenModal ? () => onCellOpenModal!(dayIso) : () => onSelect(isSelected ? null : dayIdx)}
        style={styles.readOnlyPressable}
      >
        <Text style={[styles.cellText, { color: cellText ? c.text : c.textPlaceholder }]}>
          {cellText || (editable && !outOfRange ? "Toca para agregar..." : "")}
        </Text>
      </Pressable>
      {dayEvents.map((ev) => (
        <View key={ev.id} style={[styles.eventChip, { backgroundColor: EVENT_COLORS[ev.type] }]}>
          <Text style={styles.eventChipText} numberOfLines={1}>{ev.name}</Text>
        </View>
      ))}
    </View>
  );
}

type WeeklyGridProps = {
  weeks: WeekRow[];
  cells: Record<string, string>;
  events: CalendarEvent[];
  editable: boolean;
  planStartDate?: string | undefined;
  planEndDate?: string | undefined;
  onCellOpenModal?: ((dateIso: string) => void) | undefined;
};

export function WeeklyGrid({ weeks, cells, events, editable, planStartDate, planEndDate, onCellOpenModal }: WeeklyGridProps) {
  const c = useColors();
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    (acc[ev.date] ??= []).push(ev);
    return acc;
  }, {});

  return (
    <ScrollView style={styles.vScroll} showsVerticalScrollIndicator={false} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.hScroll}>
        <View style={styles.table}>
          {/* Header row */}
          <View style={[styles.row, styles.headerRow, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
            <View style={[styles.weekCol, styles.headerCell, { borderRightColor: c.border }]}>
              <Text style={[styles.headerText, { color: c.textMuted }]}>Sem.</Text>
            </View>
            {DAY_HEADERS.map((d, i) => (
              <View key={d} style={[styles.dayCol, styles.headerCell, { borderRightColor: c.border }]}>
                <Text style={[styles.headerText, { color: selectedDayIdx === i ? c.primary : c.textMuted }]}>{d}</Text>
              </View>
            ))}
          </View>

          {weeks.map((week) => (
            <View key={week.weekNum} style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[styles.weekCol, styles.weekLabelCell, { backgroundColor: c.backgroundStrong, borderRightColor: c.border }]}>
                <Text style={[styles.weekNumText, { color: c.text }]}>{week.weekNum}</Text>
                <Text style={[styles.weekRangeText, { color: c.textMuted }]}>{week.range}</Text>
              </View>
              {week.days.map((dayIso, dayIdx) => {
                const outOfRange =
                  (planStartDate != null && dayIso < planStartDate) ||
                  (planEndDate != null && dayIso > planEndDate);
                return (
                  <DayCell
                    key={dayIso}
                    dayIso={dayIso}
                    dayIdx={dayIdx}
                    cellText={cells[dayIso] ?? ""}
                    dayEvents={eventsByDate[dayIso] ?? []}
                    outOfRange={outOfRange}
                    editable={editable}
                    isSelected={selectedDayIdx === dayIdx}
                    onCellOpenModal={onCellOpenModal}
                    onSelect={setSelectedDayIdx}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {weeks.length === 0 && (
        <View style={[styles.emptyState, { borderColor: c.border }]}>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>
            Selecciona un plan o crea uno para ver el calendario.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  vScroll: { flex: 1 },
  hScroll: { flexGrow: 0 },
  table: { width: WEEK_COL_W + DAY_COL_W * 7 },
  row: { flexDirection: "row" },
  headerRow: { borderBottomWidth: 1 },
  headerCell: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: 2,
    borderRightWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  weekCol: { width: WEEK_COL_W, flexShrink: 0 },
  dayCol: { width: DAY_COL_W, flexShrink: 0 },
  weekLabelCell: {
    padding: SPACING.xs,
    borderRightWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  weekNumText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700", textAlign: "center" },
  weekRangeText: { fontSize: 9, textAlign: "center" },
  dayCell: {
    width: DAY_COL_W,
    flexShrink: 0,
    minHeight: CELL_MIN_H,
    borderRightWidth: StyleSheet.hairlineWidth,
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  readOnlyPressable: { flex: 1 },
  cellText: { fontSize: TYPOGRAPHY.fontSize.sm, lineHeight: 18, flex: 1 },
  eventChip: { borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.xs, paddingVertical: 2 },
  eventChipText: { fontSize: TYPOGRAPHY.fontSize.xs, color: "#ffffff", fontWeight: "600" },
  emptyState: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.md,
    margin: SPACING.md,
    padding: SPACING.xl,
    alignItems: "center",
  },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.sm },
});
