import { type ReactNode } from "react";
import { View, Text, useWindowDimensions, StyleSheet } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { DataTableSkeleton } from "@/shared/components/feedback/SkeletonLoader";

export type Column<T> = {
  key: keyof T & string;
  header: string;
  flex?: number;
  render?: (value: T[keyof T & string], row: T) => ReactNode;
};

type DataTableProps<T extends Record<string, unknown>> = {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  renderActions?: (item: T) => ReactNode;
  isLoading?: boolean;
  emptyText?: string;
};

function MobileCard<T extends Record<string, unknown>>({
  row,
  columns,
  renderActions,
  isEven,
}: {
  row: T;
  columns: Column<T>[];
  renderActions?: (item: T) => ReactNode;
  isEven: boolean;
}) {
  const c = useColors();
  return (
    <View
      style={[
        styles.mobileCard,
        { backgroundColor: isEven ? c.backgroundStrong : c.background, borderColor: c.border },
      ]}
    >
      {columns.map((col) => {
        const rawValue = row[col.key];
        const renderedValue = col.render
          ? col.render(rawValue as T[keyof T & string], row)
          : String(rawValue ?? "—");

        return (
          <View key={col.key} style={styles.mobileRow}>
            <Text style={[styles.mobileLabel, { color: c.textMuted }]}>{col.header}</Text>
            {typeof renderedValue === "string" ? (
              <Text style={[styles.cellText, { color: c.text, flex: 1 }]}>{renderedValue}</Text>
            ) : (
              <View style={{ flex: 1 }}>{renderedValue}</View>
            )}
          </View>
        );
      })}
      {renderActions && (
        <View style={styles.actionsRow}>{renderActions(row)}</View>
      )}
    </View>
  );
}

function DesktopRow<T extends Record<string, unknown>>({
  row,
  columns,
  renderActions,
  isEven,
}: {
  row: T;
  columns: Column<T>[];
  renderActions?: (item: T) => ReactNode;
  isEven: boolean;
}) {
  const c = useColors();
  return (
    <View
      style={[
        styles.desktopRow,
        { backgroundColor: isEven ? c.backgroundStrong : c.background },
      ]}
    >
      {columns.map((col) => {
        const rawValue = row[col.key];
        const renderedValue = col.render
          ? col.render(rawValue as T[keyof T & string], row)
          : String(rawValue ?? "—");

        return (
          <View key={col.key} style={{ flex: col.flex ?? 1, justifyContent: "center" }}>
            {typeof renderedValue === "string" ? (
              <Text style={[styles.cellText, { color: c.text }]}>{renderedValue}</Text>
            ) : (
              renderedValue
            )}
          </View>
        );
      })}
      {renderActions && (
        <View style={styles.actionsRow}>{renderActions(row)}</View>
      )}
    </View>
  );
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  renderActions,
  isLoading = false,
  emptyText = "No data available.",
}: DataTableProps<T>) {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const c = useColors();

  if (isLoading) return <DataTableSkeleton rows={5} />;

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: c.textMuted }]}>{emptyText}</Text>
      </View>
    );
  }

  if (isMobile) {
    return (
      <View style={{ gap: 12 }}>
        {data.map((row, index) => (
          <MobileCard
            key={keyExtractor(row)}
            row={row}
            columns={columns}
            renderActions={renderActions}
            isEven={index % 2 === 0}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.table, { borderColor: c.border }]}>
      <View style={[styles.tableHeader, { backgroundColor: c.backgroundStrong, borderBottomColor: c.border }]}>
        {columns.map((col) => (
          <View key={col.key} style={{ flex: col.flex ?? 1 }}>
            <Text style={[styles.headerCell, { color: c.textMuted }]}>{col.header}</Text>
          </View>
        ))}
        {renderActions && <View style={{ width: 120 }} />}
      </View>
      {data.map((row, index) => (
        <DesktopRow
          key={keyExtractor(row)}
          row={row}
          columns={columns}
          renderActions={renderActions}
          isEven={index % 2 === 0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: { padding: 24, alignItems: "center" },
  emptyText: { fontSize: 14 },
  mobileCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  mobileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  mobileLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    minWidth: 80,
  },
  cellText: { fontSize: 14 },
  actionsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 },
  table: { borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  desktopRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
});
