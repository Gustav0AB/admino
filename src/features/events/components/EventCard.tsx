import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { useColors } from "@/shared/hooks/useColors";
import { StatusBadge } from "@/shared/components/data-display/StatusBadge";
import type { BadgeStatus } from "@/shared/components/data-display/StatusBadge";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import type { CompetitionEvent } from "../types";
import { EVENT_TYPE_COLORS, formatEventDate } from "../utils/eventUtils";

const STATUS_BADGE_MAP: Record<CompetitionEvent["status"], BadgeStatus> = {
  upcoming: "pending",
  ongoing: "active",
  completed: "completed",
  cancelled: "cancelled",
};

type EventCardProps = {
  event: CompetitionEvent;
  onLogBiometrics: (event: CompetitionEvent) => void;
};

export function EventCard({ event, onLogBiometrics }: EventCardProps) {
  const { t } = useTranslation();
  const c = useColors();
  const typeColor = EVENT_TYPE_COLORS[event.type];

  return (
    <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
      <View style={[styles.typeStripe, { backgroundColor: typeColor }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: c.text }]}>{event.title}</Text>
            <Text style={[styles.typeLabel, { color: typeColor }]}>
              {t(`events.${event.type === "training_camp" ? "trainingCamp" : event.type}` as never)}
            </Text>
          </View>
          <StatusBadge
            status={STATUS_BADGE_MAP[event.status]}
            customLabel={t(`events.${event.status}` as never)}
          />
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: c.textMuted }]}>
            📅 {formatEventDate(event.startDate, event.endDate)}
          </Text>
          <Text style={[styles.meta, { color: c.textMuted }]}>
            📍 {event.location}
          </Text>
          <Text style={[styles.meta, { color: c.textMuted }]}>
            👥 {event.athleteCount} {t("events.athleteCount")}
          </Text>
        </View>

        {event.status !== "cancelled" && event.status !== "completed" && (
          <TouchableOpacity
            style={[styles.btn, { borderColor: typeColor }]}
            onPress={() => onLogBiometrics(event)}
            accessibilityRole="button"
            accessibilityLabel={`${t("events.logBiometrics")} – ${event.title}`}
          >
            <Text style={[styles.btnText, { color: typeColor }]}>
              {t("events.logBiometrics")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  typeStripe: {
    width: 4,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "600",
  },
  typeLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaRow: {
    gap: SPACING.xs,
  },
  meta: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  btn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginTop: SPACING.xs,
  },
  btnText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
  },
});
