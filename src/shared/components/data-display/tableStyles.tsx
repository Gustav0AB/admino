import { StyleSheet } from "react-native";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

/**
 * Shared visual styles for ALL tables in the app.
 * Import these in any table component (DataTable, TableShell, custom rows, etc.)
 * so that a single change here propagates everywhere.
 */
export const tableStyles = StyleSheet.create({
  // ── Wrapper ──────────────────────────────────────────────────────────────
  wrapper: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
  },

  // ── Header row ───────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  headerCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
  },
  headerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Data rows ─────────────────────────────────────────────────────────────
  row: {
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    justifyContent: "center",
  },

  // ── Checkbox ──────────────────────────────────────────────────────────────
  checkboxCell: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },

  // ── Actions cell ──────────────────────────────────────────────────────────
  actionsCell: {
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  actionBtn: {
    fontSize: TYPOGRAPHY.fontSize.md,
    paddingHorizontal: SPACING.xs,
  },

  // ── Cell text ─────────────────────────────────────────────────────────────
  cellText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: "center",
    gap: SPACING.sm,
  },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: "600" },
  emptyText: { fontSize: TYPOGRAPHY.fontSize.sm },

  // ── Fetching bar ──────────────────────────────────────────────────────────
  fetchingBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fetchingText: { fontSize: TYPOGRAPHY.fontSize.xs },

  // ── Search bar ────────────────────────────────────────────────────────────
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    paddingVertical: 2,
  },

  // ── Sort arrows ───────────────────────────────────────────────────────────
  sortArrowActive: { fontSize: 11, fontWeight: "700" },
  sortArrowInactive: { fontSize: 11, opacity: 0.35 },

  // ── Toolbar ───────────────────────────────────────────────────────────────
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  toolbarLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  toolbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flexWrap: "wrap",
  },

  // ── Panel (bulk add, etc.) ────────────────────────────────────────────────
  panel: {
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  panelHint: { fontSize: TYPOGRAPHY.fontSize.xs },
  panelActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "flex-end",
  },

  // ── Pagination ────────────────────────────────────────────────────────────
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  paginationInfo: { fontSize: TYPOGRAPHY.fontSize.xs },
  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs + 2,
  },
  paginationLabel: { fontSize: TYPOGRAPHY.fontSize.xs },
  pageSizeBtn: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: "center",
  },
  pageBtn: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Mobile card (for < 640px) ─────────────────────────────────────────────
  mobileCard: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  mobileRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  mobileLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    minWidth: 80,
  },
  mobileCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  mobileSelectLabel: { fontSize: TYPOGRAPHY.fontSize.xs },
  mobileActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
});
