import { type ReactNode, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { DataTableSkeleton } from "@/shared/components/feedback/SkeletonLoader";
import { TableShell } from "./TableShell";
import { tableStyles } from "./tableStyles";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Column<T> = {
  key: keyof T & string;
  header: string;
  /** Fixed pixel width — takes precedence over flex when set */
  width?: number;
  flex?: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (value: T[keyof T & string], row: T) => ReactNode;
};

type SortState = { key: string; dir: "asc" | "desc" };

type RowDividerStyle = "striped" | "borders";

type DataTableProps<T extends Record<string, unknown>> = {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  renderActions?: (item: T) => ReactNode;
  actionsLabel?: string;
  actionsWidth?: number;
  isLoading?: boolean;
  isFetching?: boolean;
  emptyText?: string;
  searchable?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selectedKeys: string[]) => void;
  onRowPress?: (item: T) => void;
  rowDivider?: RowDividerStyle;
  pageSize?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isWeb = Platform.OS === "web";

function alignStyle(align?: "left" | "center" | "right") {
  if (align === "center") return "center" as const;
  if (align === "right") return "flex-end" as const;
  return "flex-start" as const;
}

function textAlign(align?: "left" | "center" | "right") {
  return (align ?? "left") as "left" | "center" | "right";
}

function columnSizeStyle(col: Column<unknown>) {
  if (col.width !== undefined) return { width: col.width };
  return { flex: col.flex ?? 1 };
}

// ─── Sort Arrow ───────────────────────────────────────────────────────────────

function SortArrow({ dir }: { dir: "asc" | "desc" | null }) {
  if (!dir) return <Text style={tableStyles.sortArrowInactive}>↕</Text>;
  return <Text style={tableStyles.sortArrowActive}>{dir === "asc" ? "↑" : "↓"}</Text>;
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({
  checked,
  indeterminate,
  onPress,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  const isChecked = checked || indeterminate;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: indeterminate ? "mixed" : checked }}
      style={[
        tableStyles.checkbox,
        {
          borderColor: isChecked ? c.primary : c.border,
          backgroundColor: isChecked ? c.primary : "transparent",
        },
      ]}
    >
      {indeterminate ? (
        <Text style={[tableStyles.checkMark, { color: c.primaryForeground }]}>–</Text>
      ) : checked ? (
        <Text style={[tableStyles.checkMark, { color: c.primaryForeground }]}>✓</Text>
      ) : null}
    </Pressable>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ text, c }: { text: string; c: ReturnType<typeof useColors> }) {
  return (
    <View style={tableStyles.emptyContainer}>
      <Text style={[tableStyles.emptyIcon, { color: c.border }]}>☰</Text>
      <Text style={[tableStyles.emptyTitle, { color: c.text }]}>No results</Text>
      <Text style={[tableStyles.emptyText, { color: c.textMuted }]}>{text}</Text>
    </View>
  );
}

// ─── Fetching Bar ─────────────────────────────────────────────────────────────

function FetchingBar({ c }: { c: ReturnType<typeof useColors> }) {
  return (
    <View style={[tableStyles.fetchingBar, { backgroundColor: c.backgroundStrong }]}>
      <ActivityIndicator size="small" color={c.primary} />
      <Text style={[tableStyles.fetchingText, { color: c.textMuted }]}>Refreshing…</Text>
    </View>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  pageSize,
  pageSizeOptions,
  totalRows,
  onPage,
  onPageSize,
  c,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalRows: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
  c: ReturnType<typeof useColors>;
}) {
  const start = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRows);

  return (
    <>
      <Text style={[tableStyles.paginationInfo, { color: c.textMuted }]}>
        {totalRows === 0 ? "0 results" : `${start}–${end} of ${totalRows}`}
      </Text>
      <View style={tableStyles.paginationControls}>
        <Text style={[tableStyles.paginationLabel, { color: c.textMuted }]}>Rows:</Text>
        {pageSizeOptions.map((s) => (
          <Pressable
            key={s}
            onPress={() => onPageSize(s)}
            style={[
              tableStyles.pageSizeBtn,
              {
                backgroundColor: s === pageSize ? c.primary : "transparent",
                borderColor: s === pageSize ? c.primary : c.border,
              },
            ]}
          >
            <Text style={{ color: s === pageSize ? c.primaryForeground : c.textMuted, fontSize: 12 }}>
              {s}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => onPage(page - 1)}
          disabled={page <= 1}
          style={[tableStyles.pageBtn, { borderColor: c.border, opacity: page <= 1 ? 0.4 : 1 }]}
        >
          <Text style={{ color: c.text, fontSize: 13 }}>‹</Text>
        </Pressable>
        <Text style={[tableStyles.paginationLabel, { color: c.text }]}>
          {page} / {totalPages || 1}
        </Text>
        <Pressable
          onPress={() => onPage(page + 1)}
          disabled={page >= totalPages}
          style={[tableStyles.pageBtn, { borderColor: c.border, opacity: page >= totalPages ? 0.4 : 1 }]}
        >
          <Text style={{ color: c.text, fontSize: 13 }}>›</Text>
        </Pressable>
      </View>
    </>
  );
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function MobileCard<T extends Record<string, unknown>>({
  row,
  columns,
  renderActions,
  isEven,
  rowDivider,
  selectable,
  selected,
  onSelect,
  onRowPress,
  c,
}: {
  row: T;
  columns: Column<T>[];
  renderActions?: (item: T) => ReactNode;
  isEven: boolean;
  rowDivider: RowDividerStyle;
  selectable: boolean;
  selected: boolean;
  onSelect: () => void;
  onRowPress?: (item: T) => void;
  c: ReturnType<typeof useColors>;
}) {
  const bg =
    rowDivider === "striped"
      ? isEven ? c.backgroundStrong : c.background
      : c.background;

  return (
    <Pressable
      onPress={onRowPress ? () => onRowPress(row) : undefined}
      accessibilityRole={onRowPress ? "button" : undefined}
      style={({ pressed }) => [
        tableStyles.mobileCard,
        {
          backgroundColor: pressed && onRowPress ? c.backgroundHover : bg,
          borderColor: c.border,
        },
      ]}
    >
      {selectable && (
        <View style={tableStyles.mobileCheckboxRow}>
          <Checkbox checked={selected} onPress={onSelect} />
          <Text style={[tableStyles.mobileSelectLabel, { color: c.textMuted }]}>
            {selected ? "Selected" : "Select row"}
          </Text>
        </View>
      )}
      {columns.map((col) => {
        const rawValue = row[col.key];
        const renderedValue = col.render
          ? col.render(rawValue as T[keyof T & string], row)
          : String(rawValue ?? "—");

        return (
          <View key={col.key} style={tableStyles.mobileRow}>
            <Text style={[tableStyles.mobileLabel, { color: c.textMuted }]}>{col.header}</Text>
            {typeof renderedValue === "string" ? (
              <Text style={[tableStyles.cellText, { color: c.text, flex: 1, textAlign: textAlign(col.align) }]}>
                {renderedValue}
              </Text>
            ) : (
              <View style={{ flex: 1, alignItems: alignStyle(col.align) }}>{renderedValue}</View>
            )}
          </View>
        );
      })}
      {renderActions && (
        <View style={tableStyles.mobileActionsRow}>{renderActions(row)}</View>
      )}
    </Pressable>
  );
}

// ─── Desktop Row ──────────────────────────────────────────────────────────────

function DesktopRow<T extends Record<string, unknown>>({
  row,
  columns,
  renderActions,
  actionsWidth,
  isEven,
  rowDivider,
  selectable,
  selected,
  onSelect,
  onRowPress,
  c,
}: {
  row: T;
  columns: Column<T>[];
  renderActions?: (item: T) => ReactNode;
  actionsWidth: number;
  isEven: boolean;
  rowDivider: RowDividerStyle;
  selectable: boolean;
  selected: boolean;
  onSelect: () => void;
  onRowPress?: (item: T) => void;
  c: ReturnType<typeof useColors>;
}) {
  const stripedBg = isEven ? c.backgroundStrong : c.background;

  return (
    <Pressable
      onPress={onRowPress ? () => onRowPress(row) : undefined}
      accessibilityRole={onRowPress ? "button" : undefined}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        tableStyles.row,
        rowDivider === "borders" && { borderBottomColor: c.border },
        {
          backgroundColor:
            pressed && onRowPress
              ? c.backgroundHover
              : hovered
              ? c.backgroundStrong
              : rowDivider === "striped"
              ? stripedBg
              : c.background,
          borderBottomColor: c.border,
          cursor: onRowPress ? "pointer" : "default",
        } as object,
      ]}
    >
      {selectable && (
        <View style={tableStyles.checkboxCell}>
          <Checkbox checked={selected} onPress={onSelect} />
        </View>
      )}
      {columns.map((col) => {
        const rawValue = row[col.key];
        const renderedValue = col.render
          ? col.render(rawValue as T[keyof T & string], row)
          : String(rawValue ?? "—");

        return (
          <View
            key={col.key}
            style={[
              tableStyles.cell,
              columnSizeStyle(col as Column<unknown>),
              { alignItems: alignStyle(col.align) },
            ]}
            // @ts-ignore — web-only ARIA
            role={isWeb ? "cell" : undefined}
          >
            {typeof renderedValue === "string" ? (
              <Text style={[tableStyles.cellText, { color: c.text, textAlign: textAlign(col.align) }]}>
                {renderedValue}
              </Text>
            ) : (
              renderedValue
            )}
          </View>
        );
      })}
      {renderActions && (
        <View style={[tableStyles.actionsCell, { width: actionsWidth }]}>{renderActions(row)}</View>
      )}
    </Pressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  renderActions,
  actionsLabel = "Actions",
  actionsWidth = 120,
  isLoading = false,
  isFetching = false,
  emptyText = "No data available.",
  searchable = false,
  selectable = false,
  onSelectionChange,
  onRowPress,
  rowDivider = "striped",
  pageSize: initialPageSize = 10,
}: DataTableProps<T>) {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const c = useColors();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // ── Filter ──
  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => String(row[col.key] ?? "").toLowerCase().includes(q))
    );
  }, [data, search, searchable, columns]);

  // ── Sort ──
  const sorted = useMemo(() => {
    if (!sort) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key] ?? "";
      const bv = b[sort.key] ?? "";
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sort]);

  // ── Paginate ──
  const totalRows = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ── Selection helpers ──
  const allPageKeys = paginated.map(keyExtractor);
  const allSelected = allPageKeys.length > 0 && allPageKeys.every((k) => selectedKeys.has(k));
  const someSelected = allPageKeys.some((k) => selectedKeys.has(k)) && !allSelected;

  function toggleRow(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      onSelectionChange?.([...next]);
      return next;
    });
  }

  function toggleAll() {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        allPageKeys.forEach((k) => next.delete(k));
      } else {
        allPageKeys.forEach((k) => next.add(k));
      }
      onSelectionChange?.([...next]);
      return next;
    });
  }

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
    setPage(1);
  }

  function handlePageSize(s: number) {
    setPageSize(s);
    setPage(1);
  }

  if (isLoading) return <DataTableSkeleton rows={5} />;

  // ── Search bar ──
  const searchBar = searchable ? (
    <View style={[tableStyles.searchBar, { borderColor: c.border, backgroundColor: c.backgroundStrong }]}>
      <Text style={[tableStyles.searchIcon, { color: c.textMuted }]}>⌕</Text>
      <TextInput
        value={search}
        onChangeText={(t: string) => { setSearch(t); setPage(1); }}
        placeholder="Search…"
        placeholderTextColor={c.textPlaceholder}
        style={[tableStyles.searchInput, { color: c.text }]}
        accessibilityLabel="Search table"
        clearButtonMode="while-editing"
      />
    </View>
  ) : null;

  const isEmpty = paginated.length === 0;

  // ── Column header row ──
  const headerRow = (
    <>
      {selectable && (
        <View style={tableStyles.checkboxCell}>
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onPress={toggleAll}
          />
        </View>
      )}
      {columns.map((col) => (
        <Pressable
          key={col.key}
          onPress={col.sortable ? () => toggleSort(col.key) : undefined}
          style={[
            tableStyles.headerCell,
            columnSizeStyle(col as Column<unknown>),
            { alignItems: alignStyle(col.align), cursor: col.sortable ? "pointer" : "default" } as object,
          ]}
          // @ts-ignore
          role={isWeb ? "columnheader" : undefined}
          accessibilityLabel={col.header}
        >
          <Text style={[tableStyles.headerText, { color: c.textMuted }]}>{col.header}</Text>
          {col.sortable && <SortArrow dir={sort?.key === col.key ? sort.dir : null} />}
        </Pressable>
      ))}
      {renderActions && (
        <View style={[{ width: actionsWidth }, tableStyles.headerCell, { alignItems: alignStyle("right") }]}>
          <Text style={[tableStyles.headerText, { color: c.textMuted }]}>{actionsLabel}</Text>
        </View>
      )}
    </>
  );

  // ─── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <View style={localStyles.mobileContainer}>
        {isFetching && <FetchingBar c={c} />}
        {searchBar}
        {isEmpty ? (
          <EmptyState text={emptyText} c={c} />
        ) : (
          paginated.map((row, index) => (
            <MobileCard
              key={keyExtractor(row)}
              row={row}
              columns={columns}
              {...(renderActions ? { renderActions } : {})}
              {...(onRowPress ? { onRowPress } : {})}
              isEven={index % 2 === 0}
              rowDivider={rowDivider}
              selectable={selectable}
              selected={selectedKeys.has(keyExtractor(row))}
              onSelect={() => toggleRow(keyExtractor(row))}
              c={c}
            />
          ))
        )}
        <View style={[tableStyles.pagination, { borderTopColor: c.border }]}>
          <Pagination
            page={safePage}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            totalRows={totalRows}
            onPage={setPage}
            onPageSize={handlePageSize}
            c={c}
          />
        </View>
      </View>
    );
  }

  // ─── Desktop layout — uses TableShell ───────────────────────────────────────
  return (
    <View>
      {isFetching && <FetchingBar c={c} />}
      {searchBar}
      <TableShell
        header={headerRow}
        footer={
          <Pagination
            page={safePage}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            totalRows={totalRows}
            onPage={setPage}
            onPageSize={handlePageSize}
            c={c}
          />
        }
      >
        {isEmpty ? (
          <EmptyState text={emptyText} c={c} />
        ) : (
          paginated.map((row, index) => (
            <DesktopRow
              key={keyExtractor(row)}
              row={row}
              columns={columns}
              {...(renderActions ? { renderActions } : {})}
              {...(onRowPress ? { onRowPress } : {})}
              actionsWidth={actionsWidth}
              isEven={index % 2 === 0}
              rowDivider={rowDivider}
              selectable={selectable}
              selected={selectedKeys.has(keyExtractor(row))}
              onSelect={() => toggleRow(keyExtractor(row))}
              c={c}
            />
          ))
        )}
      </TableShell>
    </View>
  );
}

const localStyles = StyleSheet.create({
  mobileContainer: { gap: 12 },
});
