import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useColors } from "@/shared/hooks/useColors";
import { DataTable, type Column } from "@/shared/components/data-display/DataTable";
import { StatusBadge, type BadgeStatus } from "@/shared/components/data-display/StatusBadge";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import type { TrainingPlan } from "../types";
import { formatDate } from "../utils/planUtils";

const STATUS_MAP: Record<TrainingPlan["status"], BadgeStatus> = {
  active: "active",
  draft: "warning",
  archived: "cancelled",
};

type PlansTableProps = {
  data: TrainingPlan[];
  isLoading: boolean;
  isFetching: boolean;
  onClone: (plan: TrainingPlan) => void;
};

export function PlansTable({ data, isLoading, isFetching, onClone }: PlansTableProps) {
  const { t } = useTranslation();
  const c = useColors();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const columns: Column<TrainingPlan>[] = [
    {
      key: "name",
      header: t("trainingPlanning.planName"),
      flex: 2,
      sortable: true,
    },
    {
      key: "layoutType",
      header: t("trainingPlanning.layoutType"),
      flex: 1,
      render: (value) => (
        <Text style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: c.text }}>
          {value === "day-based"
            ? t("trainingPlanning.layoutDayBased").split(" ")[0]
            : t("trainingPlanning.layoutCycleBased").split(" ")[0]}
        </Text>
      ),
    },
    {
      key: "totalWeeks",
      header: t("trainingPlanning.totalWeeks"),
      flex: 1,
      align: "center",
      render: (value) => (
        <Text style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: c.text }}>
          {String(value)} {t("trainingPlanning.weeks")}
        </Text>
      ),
    },
    {
      key: "athleteCount",
      header: t("trainingPlanning.athleteCount"),
      flex: 1,
      align: "center",
      sortable: true,
    },
    {
      key: "status",
      header: t("trainingPlanning.planStatus"),
      flex: 1,
      align: "center",
      render: (value) => (
        <StatusBadge
          status={STATUS_MAP[value as TrainingPlan["status"]] ?? "info"}
        />
      ),
    },
    {
      key: "createdAt",
      header: t("trainingPlanning.createdAt"),
      flex: 1,
      sortable: true,
      render: (value) => (
        <Text style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: c.textMuted }}>
          {formatDate(String(value))}
        </Text>
      ),
    },
  ];

  return (
    <DataTable<TrainingPlan>
      data={data}
      columns={columns}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      isFetching={isFetching}
      searchable
      selectable
      rowDivider="striped"
      onSelectionChange={setSelectedKeys}
      emptyText={t("trainingPlanning.noPlans")}
      renderActions={(item) => (
        <TouchableOpacity
          onPress={() => onClone(item)}
          style={[styles.cloneBtn, { borderColor: c.border }]}
          accessibilityRole="button"
          accessibilityLabel={`${t("trainingPlanning.clonePlan")} ${item.name}`}
        >
          <Text style={[styles.cloneBtnText, { color: c.text }]}>
            {t("trainingPlanning.clonePlan")}
          </Text>
        </TouchableOpacity>
      )}
      actionsLabel={t("common.edit")}
    />
  );
}

const styles = StyleSheet.create({
  cloneBtn: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  cloneBtnText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "500",
  },
});
