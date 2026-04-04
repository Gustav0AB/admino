import { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/shared/hooks/useColors";
import { useUrlState } from "@/shared/hooks/useUrlState";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomTabs } from "@/shared/components/inputs/CustomTabs";
import { BORDER_RADIUS, BREAKPOINTS, SPACING, TYPOGRAPHY, Z_INDEX } from "@/shared/theme/tokens";

const MAX_CONTENT_WIDTH = 1920;
const SIDEBAR_WIDTH = 280;
import { StickyWrapper } from "./StickyWrapper";
import { BottomDrawer } from "./BottomDrawer";

// ─── Public types ─────────────────────────────────────────────────────────────

export type SaveAction = {
  /** Button label */
  label: string;
  /** Optional leading icon component */
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  onClick: () => void;
  /** "primary" renders filled; "secondary" renders filled-secondary */
  type: "primary" | "secondary";
};

export type TabConfig = {
  key: string;
  label: string;
  badge?: number;
};

export type FeatureShellProps = {
  // ── Row 1 ──────────────────────────────────────────────
  /** Page heading */
  title: string;
  /** Config-driven action buttons in the header */
  saveActions?: SaveAction[];

  // ── Row 2 ──────────────────────────────────────────────
  /** When provided, a tab bar is rendered and rows 3–4 sit under it */
  tabs?: TabConfig[];
  /** URL search-param key used to persist active tab. Default: "view" */
  tabUrlKey?: string;
  /** Controlled active tab — overrides URL state when provided */
  activeTab?: string;
  /** Called when the user switches tabs (both controlled & uncontrolled) */
  onTabChange?: (key: string) => void;

  // ── Row 3 ──────────────────────────────────────────────
  /** Inline filter bar (desktop) / bottom-drawer trigger (mobile) */
  filters?: React.ReactNode;

  // ── Row 4 ──────────────────────────────────────────────
  /** Local data actions rendered when nothing is selected */
  tableActions?: React.ReactNode;
  /** Number of selected rows — drives the Bulk Action Bar */
  selectedCount?: number;
  /** High-contrast bar content shown when selectedCount > 0 */
  bulkActions?: React.ReactNode;

  // ── Row 5 ──────────────────────────────────────────────
  /** Primary content slot (75 % width on desktop) */
  children: React.ReactNode;
  /**
   * Sidebar slot (25 % width on desktop).
   * On mobile, cards are surfaced as a horizontally-scrollable "peek" row
   * above the main content. Each card should have a fixed width (~220 px)
   * so the peek works correctly.
   */
  sidebarCards?: React.ReactNode;
  /** When true the main slot fills 100 % width and the sidebar is hidden */
  hideSidebar?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function FeatureShell({
  title,
  saveActions = [],
  tabs,
  tabUrlKey = "view",
  activeTab: controlledTab,
  onTabChange,
  filters,
  tableActions,
  selectedCount = 0,
  bulkActions,
  children,
  sidebarCards,
  hideSidebar = false,
}: FeatureShellProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isDesktop = width >= BREAKPOINTS.desktop;
  const isMobileView = width < BREAKPOINTS.tablet;

  // ── URL-backed tab state (ignored when activeTab prop is controlled) ────────
  const [urlTab, setUrlTab] = useUrlState(tabUrlKey, tabs?.[0]?.key ?? "");
  const resolvedActiveTab = controlledTab ?? urlTab;
  const handleTabChange = (key: string) => {
    if (!controlledTab) setUrlTab(key);
    onTabChange?.(key);
  };

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [kebabOpen, setKebabOpen] = useState(false);

  const hasTabs = !!tabs && tabs.length > 0;
  const hasBulkBar = selectedCount > 0 && !!bulkActions;
  const hasSidebar = !hideSidebar && !!sidebarCards;

  // ── Row 1 helpers ─────────────────────────────────────────────────────────
  const primaryActions = saveActions.filter((a) => a.type === "primary");
  const secondaryActions = saveActions.filter((a) => a.type === "secondary");

  const renderHeaderActions = () => {
    if (saveActions.length === 0) return null;

    // Mobile: show first primary inline + kebab for everything else
    if (isMobileView) {
      const [firstPrimary] = primaryActions;
      const kebabItems = [...secondaryActions, ...primaryActions.slice(1)];
      return (
        <View style={styles.actionsRow}>
          {firstPrimary && (
            <CustomButton variant="primary" size="sm" onPress={firstPrimary.onClick}>
              {firstPrimary.label}
            </CustomButton>
          )}
          {kebabItems.length > 0 && (
            <View>
              <TouchableOpacity
                style={[
                  styles.kebabBtn,
                  { borderColor: c.border, backgroundColor: c.backgroundStrong },
                ]}
                onPress={() => setKebabOpen((v) => !v)}
                accessibilityLabel="More actions"
                accessibilityRole="button"
              >
                <Text style={[styles.kebabIcon, { color: c.text }]}>⋮</Text>
              </TouchableOpacity>

              {kebabOpen && (
                <View
                  style={[
                    styles.kebabMenu,
                    { backgroundColor: c.background, borderColor: c.border },
                  ]}
                >
                  {kebabItems.map((action, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.kebabItem,
                        {
                          borderBottomColor: c.border,
                          borderBottomWidth: i < kebabItems.length - 1 ? StyleSheet.hairlineWidth : 0,
                        },
                      ]}
                      onPress={() => {
                        action.onClick();
                        setKebabOpen(false);
                      }}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.kebabItemText, { color: c.text }]}>
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      );
    }

    // Desktop: all buttons visible
    return (
      <View style={styles.actionsRow}>
        {secondaryActions.map((action, i) => (
          <CustomButton key={i} variant="secondary" size="sm" onPress={action.onClick}>
            {action.label}
          </CustomButton>
        ))}
        {primaryActions.map((action, i) => (
          <CustomButton key={i} variant="primary" size="sm" onPress={action.onClick}>
            {action.label}
          </CustomButton>
        ))}
      </View>
    );
  };

  // ── Row 3 helpers ─────────────────────────────────────────────────────────
  const renderFilters = () => {
    if (!filters) return null;

    // Mobile: replace bar with a single trigger button + bottom drawer
    if (isMobileView) {
      return (
        <View
          style={[
            styles.mobileFilterRow,
            { borderBottomColor: c.border, backgroundColor: c.background },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.filterTrigger,
              { borderColor: c.border, backgroundColor: c.backgroundStrong },
            ]}
            onPress={() => setFilterDrawerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
          >
            <Text style={[styles.filterTriggerText, { color: c.text }]}>⚙  Filters</Text>
          </TouchableOpacity>

          <BottomDrawer
            visible={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            title="Filters"
          >
            {filters}
          </BottomDrawer>
        </View>
      );
    }

    // Desktop: inline filter bar
    return (
      <View
        style={[
          styles.filtersRow,
          { borderBottomColor: c.border, backgroundColor: c.background },
        ]}
      >
        {filters}
      </View>
    );
  };

  // ── Row 4 helpers ─────────────────────────────────────────────────────────
  const renderTableActions = () => {
    if (!tableActions && !bulkActions) return null;

    // Bulk Action Bar (high contrast)
    if (hasBulkBar) {
      return (
        <View style={[styles.bulkBar, { backgroundColor: c.primary }]}>
          <Text style={[styles.bulkCount, { color: c.white }]}>
            {selectedCount} selected
          </Text>
          <View style={styles.actionsRow}>{bulkActions}</View>
        </View>
      );
    }

    if (!tableActions) return null;

    return (
      <View
        style={[
          styles.tableActionsRow,
          { borderBottomColor: c.border, backgroundColor: c.background },
        ]}
      >
        {tableActions}
      </View>
    );
  };

  // ── Row 5 helpers ─────────────────────────────────────────────────────────
  const isUltraWide = width > MAX_CONTENT_WIDTH;

  const renderContentRow = () => (
    <View
      style={[
        styles.contentRow,
        !isMobileView && styles.contentRowDesktop,
        isUltraWide && styles.contentRowCentered,
      ]}
    >
      {/* Mobile peek: sidebar cards in a horizontal scroll at the top */}
      {isMobileView && hasSidebar && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.peekScroll, { borderBottomColor: c.border }]}
          contentContainerStyle={styles.peekContent}
        >
          {sidebarCards}
        </ScrollView>
      )}

      {/* Main content — fills all remaining space */}
      <View style={styles.mainSlot}>
        {children}
      </View>

      {/* Desktop sidebar — fixed width, main takes the rest */}
      {!isMobileView && hasSidebar && (
        <View
          style={[
            styles.sidebarSlot,
            { borderLeftColor: c.border },
          ]}
        >
          {sidebarCards}
        </View>
      )}
    </View>
  );

  // ── Sticky header (Rows 1–4) ───────────────────────────────────────────────
  const renderStickyHeader = () => (
    <StickyWrapper>
      {/* Row 1 – Title + Save Actions */}
      <View
        style={[
          styles.headerRow,
          { backgroundColor: c.background, borderBottomColor: c.border },
        ]}
      >
        <Text style={[styles.pageTitle, { color: c.text }]}>{title}</Text>
        {renderHeaderActions()}
      </View>

      {/* Row 2 – Tabs (conditional) */}
      {hasTabs && (
        <View
          style={[
            styles.tabsRow,
            { backgroundColor: c.background, borderBottomColor: c.border },
          ]}
        >
          <CustomTabs
            tabs={tabs!}
            activeTab={resolvedActiveTab}
            onTabChange={handleTabChange}
            variant="underline"
            scrollable={isMobileView}
          />
        </View>
      )}

      {/* Row 3 – Filters */}
      {renderFilters()}

      {/* Row 4 – Table Actions / Bulk Bar */}
      {renderTableActions()}
    </StickyWrapper>
  );

  // ── Shell root ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.shell, { backgroundColor: c.background }]}>
      {renderStickyHeader()}

      {/* Row 5 – Scrollable content area */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.md },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderContentRow()}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },

  // ── Row 1
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  pageTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: -0.5,
    flex: 1,
    marginRight: SPACING.sm,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  // Kebab
  kebabBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  kebabIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  kebabMenu: {
    position: "absolute",
    right: 0,
    top: 40,
    minWidth: 160,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: Z_INDEX.dropdown,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  kebabItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  kebabItemText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },

  // ── Row 2
  tabsRow: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  // ── Row 3
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mobileFilterRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterTrigger: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  filterTriggerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // ── Row 4 – table actions
  tableActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  // ── Row 4 – bulk bar
  bulkBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  bulkCount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },

  // ── Row 5 – scroll container
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── Row 5 – content layout
  contentRow: {
    flex: 1,
    width: "100%",
  },
  contentRowDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  contentRowCentered: {
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
  mainSlot: {
    flex: 1,
    minHeight: 200,
  },
  sidebarSlot: {
    width: SIDEBAR_WIDTH,
    flexShrink: 0,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },

  // ── Mobile peek
  peekScroll: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  peekContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    flexDirection: "row",
    alignItems: "flex-start",
  },
});
