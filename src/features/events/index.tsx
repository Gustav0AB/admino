import { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/shared/components/MainLayout";
import { useColors } from "@/shared/hooks/useColors";
import { BREAKPOINTS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useEvents } from "./hooks/useEvents";
import { CalendarGrid } from "./components/CalendarGrid";
import { CalendarList } from "./components/CalendarList";
import { EventFilters } from "./components/EventFilters";
import { BiometricsFormModal } from "./components/BiometricsFormModal";
import type { CompetitionEvent, EventFilters as TEventFilters } from "./types";
import dayjs from "dayjs";

const DEFAULT_FILTERS: TEventFilters = {
  eventType: "",
  fromDate: null,
  toDate: null,
};

export function EventsScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const { width } = useWindowDimensions();
  const isWeb = width >= BREAKPOINTS.tablet;

  const { data: events, isLoading } = useEvents();
  const [filters, setFilters] = useState<TEventFilters>(DEFAULT_FILTERS);
  const [biometricsTarget, setBiometricsTarget] = useState<CompetitionEvent | null>(null);

  const filtered = useMemo(() => {
    if (!events) return [];
    return events.filter((evt) => {
      if (filters.eventType && evt.type !== filters.eventType) return false;
      if (filters.fromDate && dayjs(evt.endDate).isBefore(dayjs(filters.fromDate), "day")) return false;
      if (filters.toDate && dayjs(evt.startDate).isAfter(dayjs(filters.toDate), "day")) return false;
      return true;
    });
  }, [events, filters]);

  return (
    <MainLayout scrollable padding={false}>
      <View style={[styles.header, { borderBottomColor: c.border, backgroundColor: c.background }]}>
        <Text style={[styles.title, { color: c.text }]}>{t("events.title")}</Text>
      </View>

      <View style={[styles.filtersSection, { borderBottomColor: c.border, backgroundColor: c.background }]}>
        <EventFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(DEFAULT_FILTERS)}
        />
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={c.primary} />
            <Text style={[styles.loadingText, { color: c.textMuted }]}>
              {t("common.loading")}
            </Text>
          </View>
        ) : isWeb ? (
          <CalendarGrid
            events={filtered}
            onLogBiometrics={setBiometricsTarget}
          />
        ) : (
          <CalendarList
            events={filtered}
            onLogBiometrics={setBiometricsTarget}
          />
        )}
      </View>

      <BiometricsFormModal
        event={biometricsTarget}
        open={biometricsTarget !== null}
        onOpenChange={(open) => {
          if (!open) setBiometricsTarget(null);
        }}
      />
    </MainLayout>
  );
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
  filtersSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    padding: SPACING.md,
  },
  loader: {
    paddingVertical: SPACING.xxxl,
    alignItems: "center",
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});
