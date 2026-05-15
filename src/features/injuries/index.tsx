import { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/shared/components/MainLayout";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { H2, Body } from "@/shared/components/typography/Label";
import { useColors } from "@/shared/hooks/useColors";
import { useAuthStore } from "@/shared/store/authStore";
import { useApiQuery } from "@/shared/api/useApiQuery";
import { mockGetAthletes } from "@/shared/api/mocks/athletes";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY, FONTS } from "@/shared/theme/tokens";
import { InjuryTimeline } from "./components/InjuryTimeline";
import { LogInjuryModal } from "./components/LogInjuryModal";
import { InjuredBanner } from "./components/InjuredBanner";
import { useInjuries } from "./hooks/useInjuries";
import type { Athlete } from "@/shared/types/api";

type StatusFilter = "all" | "active" | "recovered";

export function InjuriesScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const user = useAuthStore((s) => s.user);
  const isCoach = user?.role === "ORGANIZATION" || user?.role === "SYSTEM_ADMIN";

  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(
    isCoach ? "" : (user?.id ?? "")
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [logModalOpen, setLogModalOpen] = useState(false);

  const { data: athletesResponse } = useApiQuery<{ items: Athlete[]; total: number; page: number; pageSize: number }>(
    ["athletes"],
    "/api/athletes",
    mockGetAthletes.data
  );
  const athletes = athletesResponse?.items ?? [];

  const queryAthleteId = isCoach ? selectedAthleteId || undefined : (user?.id ?? undefined);
  const { data: injuries = [], isLoading } = useInjuries(queryAthleteId);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return injuries;
    return injuries.filter((i) => i.status === statusFilter);
  }, [injuries, statusFilter]);

  const athleteOptions = athletes.map((a) => ({ label: a.name, value: a.id }));

  const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("injuries.allInjuries") },
    { key: "active", label: t("injuries.active") },
    { key: "recovered", label: t("injuries.recovered") },
  ];

  return (
    <MainLayout scrollable padding={false}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View style={styles.headerTop}>
          <H2>{t("injuries.title")}</H2>
          {isCoach && (
            <CustomButton
              variant="primary"
              size="sm"
              onPress={() => setLogModalOpen(true)}
            >
              {t("injuries.newInjury")}
            </CustomButton>
          )}
        </View>

        {isCoach && (
          <CustomSelect
            label={t("injuries.athlete")}
            options={athleteOptions}
            value={selectedAthleteId}
            onChange={(v) => setSelectedAthleteId(String(v))}
            placeholder={t("injuries.selectAthlete")}
          />
        )}

        {selectedAthleteId && <InjuredBanner athleteId={selectedAthleteId} />}
      </View>

      <View style={styles.content}>
        <View style={styles.filters}>
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setStatusFilter(f.key)}
              style={[
                styles.filterChip,
                statusFilter === f.key
                  ? { backgroundColor: c.primary, borderColor: c.primary }
                  : { backgroundColor: c.backgroundStrong, borderColor: c.border },
              ]}
            >
              <Text
                style={[
                  styles.filterLabel,
                  { color: statusFilter === f.key ? "#FFFFFF" : c.textMuted },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!isCoach || selectedAthleteId ? (
          <View style={styles.timelineSection}>
            <Body variant="muted" style={styles.sectionLabel}>
              {t("injuries.injuryHistory")} ({filtered.length})
            </Body>
            <InjuryTimeline
              injuries={filtered}
              isCoach={isCoach}
              isLoading={isLoading}
            />
          </View>
        ) : (
          <View style={[styles.selectPrompt, { backgroundColor: c.backgroundStrong }]}>
            <Text style={styles.promptIcon}>👤</Text>
            <Body variant="muted">{t("injuries.selectAthlete")}</Body>
          </View>
        )}
      </View>

      <LogInjuryModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        athletes={athletes}
        {...(selectedAthleteId ? { defaultAthleteId: selectedAthleteId } : {})}
      />
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.md,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  filters: {
    flexDirection: "row",
    gap: SPACING.xs,
    flexWrap: "wrap",
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterLabel: {
    fontFamily: FONTS.body.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
  },
  timelineSection: {
    gap: SPACING.sm,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  selectPrompt: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    alignItems: "center",
    gap: SPACING.sm,
  },
  promptIcon: {
    fontSize: 32,
  },
});
