import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { BORDER_RADIUS, FONTS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useInjuries } from "../hooks/useInjuries";

type InjuredBannerProps = {
  athleteId: string;
};

export function InjuredBanner({ athleteId }: InjuredBannerProps) {
  const { t } = useTranslation();
  const { data: injuries } = useInjuries(athleteId);

  const hasActiveInjury = injuries?.some((i) => i.status === "active") ?? false;

  if (!hasActiveInjury) return null;

  const activeInjuries = injuries?.filter((i) => i.status === "active") ?? [];
  const parts = activeInjuries.map((i) => t(`injuries.${i.bodyPart}`)).join(", ");

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>🚨</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{t("injuries.injuredBannerTitle")}</Text>
          <Text style={styles.body}>
            {t("injuries.injuredBannerBody")}
          </Text>
          {parts.length > 0 && (
            <Text style={styles.parts}>{parts}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignItems: "flex-start",
  },
  iconWrap: {
    paddingTop: 2,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: FONTS.body.semibold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "700",
    color: "#991B1B",
    letterSpacing: 0.2,
  },
  body: {
    fontFamily: FONTS.body.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: "#B91C1C",
    lineHeight: 18,
  },
  parts: {
    fontFamily: FONTS.body.semibold,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: "#DC2626",
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
