import { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { useColors } from "@/shared/hooks/useColors";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { Body, Caption, H4 } from "@/shared/components/typography/Label";
import { BORDER_RADIUS, FONTS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { SEVERITY_CONFIG, STATUS_CONFIG, BODY_PART_ICON } from "../utils/injuryUtils";
import { RecoveryModal } from "./RecoveryModal";
import type { InjuryRecord } from "../types";

type InjuryTimelineProps = {
  injuries: InjuryRecord[];
  isCoach?: boolean;
  isLoading?: boolean;
};

export function InjuryTimeline({ injuries, isCoach = false, isLoading = false }: InjuryTimelineProps) {
  const { t } = useTranslation();
  const c = useColors();
  const [recoveringInjury, setRecoveringInjury] = useState<InjuryRecord | null>(null);

  if (isLoading) {
    return (
      <View style={styles.empty}>
        <Body variant="muted">{t("common.loading")}</Body>
      </View>
    );
  }

  if (injuries.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: c.backgroundStrong }]}>
        <Text style={styles.emptyIcon}>🏥</Text>
        <Body variant="muted">{t("injuries.noInjuries")}</Body>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        scrollEnabled={false}
        contentContainerStyle={styles.list}
      >
        {injuries.map((injury, index) => {
          const isLast = index === injuries.length - 1;
          const severityConf = SEVERITY_CONFIG[injury.severity];
          const statusConf = STATUS_CONFIG[injury.status];
          const icon = BODY_PART_ICON[injury.bodyPart] ?? "🩹";
          const canRecover = isCoach && injury.status === "active";

          return (
            <View key={injury.id} style={styles.item}>
              <View style={styles.lineCol}>
                <View style={[styles.dot, { backgroundColor: severityConf.dot }]} />
                {!isLast && <View style={[styles.line, { backgroundColor: c.border }]} />}
              </View>

              <View
                style={[
                  styles.card,
                  { backgroundColor: c.backgroundStrong, borderColor: c.border },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.bodyPartIcon}>{icon}</Text>
                    <H4>{t(`injuries.${injury.bodyPart}`)}</H4>
                  </View>
                  <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: severityConf.bg }]}>
                      <Text style={[styles.badgeText, { color: severityConf.text }]}>
                        {t(`injuries.${injury.severity}`)}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusConf.bg }]}>
                      <Text style={[styles.badgeText, { color: statusConf.text }]}>
                        {t(`injuries.${injury.status}`)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.dates}>
                  <Caption variant="muted">
                    {t("injuries.occurredAt")}: {dayjs(injury.occurredAt).format("MMM D, YYYY")}
                  </Caption>
                  {injury.recoveredAt && (
                    <Caption variant="muted">
                      {t("injuries.recoveredAt")}: {dayjs(injury.recoveredAt).format("MMM D, YYYY")}
                    </Caption>
                  )}
                </View>

                {injury.notes.length > 0 && (
                  <Body variant="muted" style={styles.notes}>{injury.notes}</Body>
                )}

                {canRecover && (
                  <View style={styles.actions}>
                    <CustomButton
                      variant="primary"
                      size="sm"
                      onPress={() => setRecoveringInjury(injury)}
                    >
                      {t("injuries.markRecovered")}
                    </CustomButton>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <RecoveryModal
        injury={recoveringInjury}
        open={recoveringInjury !== null}
        onClose={() => setRecoveringInjury(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 0,
  },
  item: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  lineCol: {
    alignItems: "center",
    width: 20,
    paddingTop: SPACING.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 2,
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: 4,
    marginBottom: 0,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    flex: 1,
  },
  bodyPartIcon: {
    fontSize: 18,
  },
  badges: {
    flexDirection: "row",
    gap: SPACING.xs,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  badge: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: FONTS.body.semibold,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "700",
  },
  dates: {
    gap: 2,
  },
  notes: {
    lineHeight: 18,
  },
  actions: {
    alignItems: "flex-start",
    paddingTop: SPACING.xs,
  },
  empty: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    alignItems: "center",
    gap: SPACING.sm,
  },
  emptyIcon: {
    fontSize: 32,
  },
});
