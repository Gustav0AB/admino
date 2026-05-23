import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { MainLayout } from "@/shared/components/MainLayout";
import { useColors } from "@/shared/hooks/useColors";
import { BREAKPOINTS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useHeatmapData } from "./hooks/useHeatmap";
import { Heatmap } from "./components/Heatmap";
import { HeatmapLegend } from "./components/HeatmapLegend";
import { HeatmapSkeleton } from "./components/HeatmapSkeleton";
import { DayDetailModal } from "./components/DayDetailModal";
import { totalVolumeFormatted } from "./utils/heatmapUtils";

export function AnalyticsScreen() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isMobile = width < BREAKPOINTS.tablet;
  const { data, isLoading } = useHeatmapData();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const activeDays = data?.days.filter((d) => d.volume > 0).length ?? 0;
  const totalVolume = data?.days.reduce((sum, d) => sum + d.volume, 0) ?? 0;
  const longestStreak = data ? computeStreak(data.days) : 0;

  return (
    <MainLayout scrollable padding={false}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>Activity</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>
          {isMobile ? "Last 3 months" : "Last 12 months"}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Active days" value={String(activeDays)} c={c} />
        <StatCard label="Total volume" value={`${totalVolumeFormatted(totalVolume)} kg`} c={c} />
        <StatCard label="Best streak" value={`${longestStreak} days`} c={c} />
      </View>

      <View style={[styles.card, { borderColor: c.border, backgroundColor: c.background }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Workout Volume</Text>
          <HeatmapLegend />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.heatmapScroll}
          scrollEnabled={isMobile}
        >
          {isLoading || !data ? (
            <HeatmapSkeleton />
          ) : (
            <Heatmap
              days={data.days}
              maxVolume={data.maxVolume}
              onDayPress={setSelectedDate}
            />
          )}
        </ScrollView>
      </View>

      <DayDetailModal date={selectedDate} onClose={() => setSelectedDate(null)} />
    </MainLayout>
  );
}

function StatCard({
  label,
  value,
  c,
}: {
  label: string;
  value: string;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
}

function computeStreak(days: { date: string; volume: number }[]): number {
  const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  for (const d of sorted) {
    if (d.volume > 0) streak++;
    else break;
  }
  return streak;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
    justifyContent: "center",
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  stat: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: "center",
  },
  card: {
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "600",
  },
  heatmapScroll: {
    padding: SPACING.md,
  },
});
