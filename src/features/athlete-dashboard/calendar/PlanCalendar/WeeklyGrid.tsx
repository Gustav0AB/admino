import { useRef, useEffect, useState } from "react";
import { ScrollView, View, Text, TextInput, StyleSheet, Platform, Pressable } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { EVENT_COLORS } from "./calendarUtils";
import type { CalendarEvent, WeekRow } from "./types";

const DAY_HEADERS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const WEEK_COL_W = 110;
const DAY_COL_MIN_W = 140;
const DAY_COL_SELECTED_W = 220;
const DAY_COL_SHRUNK_W = 100;
const CELL_MIN_H = 120;

type DayCellProps = {
  dayIso: string;
  dayIdx: number;
  cellText: string;
  dayEvents: CalendarEvent[];
  outOfRange: boolean;
  editable: boolean;
  isSelected: boolean;
  hasSelection: boolean;
  onCellChange: (dateIso: string, text: string) => void;
  onCellOpenModal?: ((dateIso: string) => void) | undefined;
  onSelect: (idx: number | null) => void;
};

function DayCell({ dayIso, dayIdx, cellText, dayEvents, outOfRange, editable, isSelected, hasSelection, onCellChange, onCellOpenModal, onSelect }: DayCellProps) {
  const c = useColors();
  const cellRef = useRef<View>(null);
  const canOpenModal = !outOfRange && !!onCellOpenModal;

  useEffect(() => {
    if (Platform.OS !== "web" || !canOpenModal) return;
    const el = cellRef.current as unknown as HTMLElement | null;
    if (!el) return;
    const handler = () => onCellOpenModal!(dayIso);
    el.addEventListener("dblclick", handler);
    return () => el.removeEventListener("dblclick", handler);
  }, [dayIso, canOpenModal, onCellOpenModal]);

  const colWidth = hasSelection
    ? isSelected ? DAY_COL_SELECTED_W : DAY_COL_SHRUNK_W
    : DAY_COL_MIN_W;

  return (
    <View
      ref={cellRef}
      style={[styles.dayCell, { width: colWidth, minWidth: colWidth }, outOfRange && { opacity: 0.4 }, isSelected && { backgroundColor: c.primary + "08" }]}
    >
      {editable && !outOfRange ? (
        <TextInput
          multiline
          value={cellText}
          onChangeText={(t) => onCellChange(dayIso, t)}
          onFocus={() => onSelect(dayIdx)}
          onBlur={() => onSelect(null)}
          style={[styles.cellInput, { color: c.text, backgroundColor: "transparent" }]}
          placeholder="..."
          placeholderTextColor={c.textPlaceholder}
        />
      ) : (
        <Pressable
          onLongPress={canOpenModal ? () => onCellOpenModal!(dayIso) : undefined}
          onPress={() => onSelect(isSelected ? null : dayIdx)}
          style={styles.readOnlyPressable}
        >
          <Text style={[styles.cellText, { color: cellText ? c.text : c.textPlaceholder }]}>
            {cellText || ""}
          </Text>
        </Pressable>
      )}
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
  onCellChange: (dateIso: string, text: string) => void;
  onCellOpenModal?: ((dateIso: string) => void) | undefined;
};

export function WeeklyGrid({ weeks, cells, events, editable, planStartDate, planEndDate, onCellChange, onCellOpenModal }: WeeklyGridProps) {
  const c = useColors();
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    (acc[ev.date] ??= []).push(ev);
    return acc;
  }, {});

  const hasSelection = selectedDayIdx !== null;
  const tableMinW = WEEK_COL_W + (hasSelection
    ? DAY_COL_SELECTED_W + DAY_COL_SHRUNK_W * 6
    : DAY_COL_MIN_W * 7);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator style={styles.hScroll} contentContainerStyle={styles.hScrollContent}>
      <View style={[styles.tableWrapper, { minWidth: tableMinW }]}>
        <View style={[styles.row, styles.headerRow, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
          <View style={[styles.weekCol, styles.headerCell, { borderColor: c.border }]}>
            <Text style={[styles.headerText, { color: c.textMuted }]}>Semana</Text>
          </View>
          {DAY_HEADERS.map((d, i) => {
            const colW = hasSelection
              ? selectedDayIdx === i ? DAY_COL_SELECTED_W : DAY_COL_SHRUNK_W
              : DAY_COL_MIN_W;
            return (
              <View key={d} style={[styles.headerCell, { width: colW, borderColor: c.border }]}>
                <Text style={[styles.headerText, { color: selectedDayIdx === i ? c.primary : c.textMuted }]}>{d}</Text>
              </View>
            );
          })}
        </View>

        {weeks.map((week) => (
          <View key={week.weekNum} style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.weekCol, styles.weekLabelCell, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
              <Text style={[styles.weekNumText, { color: c.text }]}>Semana {week.weekNum}</Text>
              <Text style={[styles.weekRangeText, { color: c.textMuted }]}>{week.range}</Text>
              <Text style={[styles.weekMonthText, { color: c.textMuted }]}>{week.month}</Text>
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
                  hasSelection={hasSelection}
                  onCellChange={onCellChange}
                  onCellOpenModal={onCellOpenModal}
                  onSelect={setSelectedDayIdx}
                />
              );
            })}
          </View>
        ))}

        {weeks.length === 0 && (
          <View style={[styles.emptyState, { borderColor: c.border }]}>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>Selecciona un plan o crea uno para ver el calendario.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hScroll: { flex: 1, width: "100%" },
  hScrollContent: { flexGrow: 1 },
  tableWrapper: { flex: 1 },
  row: { flexDirection: "row" },
  headerRow: { borderBottomWidth: 1 },
  headerCell: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xs, borderRightWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center" },
  headerText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, textAlign: "center" },
  weekCol: { width: WEEK_COL_W, flexShrink: 0 },
  weekLabelCell: { padding: SPACING.sm, borderRightWidth: 1, justifyContent: "center", gap: 2 },
  weekNumText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "700" },
  weekRangeText: { fontSize: TYPOGRAPHY.fontSize.xs },
  weekMonthText: { fontSize: TYPOGRAPHY.fontSize.xs, fontStyle: "italic" },
  dayCell: { minHeight: CELL_MIN_H, borderRightWidth: StyleSheet.hairlineWidth, padding: SPACING.xs, gap: SPACING.xs, flexShrink: 0 },
  cellInput: { flex: 1, fontSize: TYPOGRAPHY.fontSize.sm, minHeight: CELL_MIN_H - SPACING.xs * 2, textAlignVertical: "top", paddingVertical: 0, paddingHorizontal: 0 },
  readOnlyPressable: { flex: 1 },
  cellText: { fontSize: TYPOGRAPHY.fontSize.sm, lineHeight: 18, flex: 1 },
  eventChip: { borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.xs, paddingVertical: 2 },
  eventChipText: { fontSize: TYPOGRAPHY.fontSize.xs, color: "#ffffff", fontWeight: "600" },
  emptyState: { borderWidth: 1, borderStyle: "dashed", borderRadius: BORDER_RADIUS.md, margin: SPACING.md, padding: SPACING.xl, alignItems: "center" },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.sm },
});
