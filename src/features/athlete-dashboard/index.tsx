import { View, StyleSheet, useWindowDimensions } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { useUrlState } from "@/shared/hooks/useUrlState";
import { CustomTabs } from "@/shared/components/inputs/CustomTabs";
import { StickyWrapper } from "@/shared/components/shell/StickyWrapper";
import { SPACING } from "@/shared/theme/tokens";
import { CalendarScreen } from "./calendar";
import { AnalyticsScreen } from "./analytics";
import { AthletesTab } from "./athletes";

const TABS = [
  { key: "calendar", label: "Calendar" },
  { key: "athletes", label: "Athletes" },
  { key: "analytics", label: "Analytics" },
];

export function AthleteDashboardScreen() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [activeTab, setActiveTab] = useUrlState("tab", "calendar");

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StickyWrapper>
        <View style={[styles.tabBar, { backgroundColor: c.background, borderBottomColor: c.border }]}>
          <CustomTabs
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="underline"
            scrollable={isMobile}
          />
        </View>
      </StickyWrapper>

      <View style={styles.content}>
        {activeTab === "calendar" && <CalendarScreen />}
        {activeTab === "athletes" && <AthletesTab />}
        {activeTab === "analytics" && <AnalyticsScreen />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flex: 1,
  },
});
