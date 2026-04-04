import { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Text,
} from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

type TabItem = {
  key: string;
  label: string;
  badge?: number;
};

type CustomTabsProps = {
  tabs: TabItem[];
  activeTab?: string;
  onTabChange?: (tabKey: string) => void;
  variant?: "default" | "pills" | "underline";
  size?: "sm" | "md" | "lg";
  scrollable?: boolean;
};

export function CustomTabs({
  tabs,
  activeTab,
  onTabChange,
  variant = "default",
  size = "md",
  scrollable = false,
}: CustomTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(
    activeTab || tabs[0]?.key,
  );
  const c = useColors();

  const currentActiveTab = activeTab || internalActiveTab;

  const handleTabPress = (tabKey: string) => {
    if (!activeTab) {
      setInternalActiveTab(tabKey);
    }
    onTabChange?.(tabKey);
  };

  const sizeStyles = {
    sm: {
      tab: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        minHeight: 32,
      },
      text: {
        fontSize: TYPOGRAPHY.fontSize.sm,
      },
    },
    md: {
      tab: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        minHeight: 40,
      },
      text: {
        fontSize: TYPOGRAPHY.fontSize.md,
      },
    },
    lg: {
      tab: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        minHeight: 48,
      },
      text: {
        fontSize: TYPOGRAPHY.fontSize.lg,
      },
    },
  };

  const variantStyles = {
    default: {
      container: {
        backgroundColor: c.surface,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.xs,
      },
      tab: {
        borderRadius: BORDER_RADIUS.sm,
        backgroundColor: "transparent",
      },
      activeTab: {
        backgroundColor: c.primary,
      },
      text: {
        color: c.textMuted,
      },
      activeText: {
        color: c.background,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
      },
    },
    pills: {
      container: {
        backgroundColor: "transparent",
      },
      tab: {
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: c.surface,
        marginRight: SPACING.sm,
        borderWidth: 1,
        borderColor: c.border,
      },
      activeTab: {
        backgroundColor: c.primary,
        borderColor: c.primary,
      },
      text: {
        color: c.text,
      },
      activeText: {
        color: c.background,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
      },
    },
    underline: {
      container: {
        backgroundColor: "transparent",
        borderBottomWidth: 1,
        borderBottomColor: c.border,
      },
      tab: {
        borderRadius: 0,
        backgroundColor: "transparent",
        marginRight: SPACING.lg,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
      },
      activeTab: {
        borderBottomColor: c.primary,
      },
      text: {
        color: c.textMuted,
      },
      activeText: {
        color: c.primary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
      },
    },
  };

  const renderTab = (tab: TabItem) => {
    const isActive = currentActiveTab === tab.key;

    return (
      <TouchableOpacity
        key={tab.key}
        style={[
          styles.tab,
          sizeStyles[size].tab,
          variantStyles[variant].tab,
          isActive && variantStyles[variant].activeTab,
        ]}
        onPress={() => handleTabPress(tab.key)}
        activeOpacity={0.7}
      >
        <View style={styles.tabContent}>
          <Text
            style={[
              sizeStyles[size].text,
              variantStyles[variant].text,
              isActive && variantStyles[variant].activeText,
            ]}
          >
            {tab.label}
          </Text>
          {tab.badge && tab.badge > 0 && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isActive ? c.background : c.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: isActive ? c.primary : c.background,
                  },
                ]}
              >
                {tab.badge > 99 ? "99+" : tab.badge}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const TabContainer = scrollable ? ScrollView : View;

  return (
    <View style={styles.container}>
      <TabContainer
        style={[
          styles.tabRow,
          variantStyles[variant].container,
          scrollable && styles.scrollableContainer,
        ]}
        contentContainerStyle={
          scrollable ? styles.scrollableContent : undefined
        }
        horizontal={scrollable}
        showsHorizontalScrollIndicator={false}
      >
        {tabs.map(renderTab)}
      </TabContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  tabRow: {
    flexDirection: "row",
  },
  scrollableContainer: {
    flexGrow: 0,
  },
  scrollableContent: {
    paddingVertical: SPACING.xs,
  },
  tab: {
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: {
        cursor: "pointer",
      },
    }),
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    marginLeft: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});
