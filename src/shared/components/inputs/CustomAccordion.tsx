import { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  Text,
} from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

type AccordionItem = {
  id: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
};

type CustomAccordionProps = {
  items: AccordionItem[];
  multiple?: boolean;
  defaultExpanded?: string[];
  variant?: "default" | "bordered" | "minimal";
  size?: "sm" | "md" | "lg";
};

export function CustomAccordion({
  items,
  multiple = false,
  defaultExpanded = [],
  variant = "default",
  size = "md",
}: CustomAccordionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(defaultExpanded),
  );
  const c = useColors();

  // Enable LayoutAnimation for Android
  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);

    if (multiple) {
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
    } else {
      if (newExpanded.has(itemId)) {
        newExpanded.clear();
      } else {
        newExpanded.clear();
        newExpanded.add(itemId);
      }
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItems(newExpanded);
  };

  const sizeStyles = {
    sm: {
      header: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        minHeight: 36,
      },
      title: {
        fontSize: TYPOGRAPHY.fontSize.sm,
      },
      content: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
      },
    },
    md: {
      header: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        minHeight: 44,
      },
      title: {
        fontSize: TYPOGRAPHY.fontSize.md,
      },
      content: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
      },
    },
    lg: {
      header: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        minHeight: 52,
      },
      title: {
        fontSize: TYPOGRAPHY.fontSize.lg,
      },
      content: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
      },
    },
  };

  const variantStyles = {
    default: {
      container: {
        backgroundColor: c.surface,
        borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.sm,
      },
      header: {
        backgroundColor: c.surface,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
      },
      content: {
        backgroundColor: c.background,
      },
    },
    bordered: {
      container: {
        backgroundColor: c.background,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.sm,
      },
      header: {
        backgroundColor: c.background,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
      },
      content: {
        backgroundColor: c.background,
      },
    },
    minimal: {
      container: {
        backgroundColor: "transparent",
        marginBottom: SPACING.xs,
      },
      header: {
        backgroundColor: "transparent",
      },
      content: {
        backgroundColor: "transparent",
        borderLeftWidth: 2,
        borderLeftColor: c.primary,
        marginLeft: SPACING.md,
      },
    },
  };

  const renderItem = (item: AccordionItem) => {
    const isExpanded = expandedItems.has(item.id);
    const isDisabled = item.disabled || false;

    return (
      <View key={item.id} style={variantStyles[variant].container}>
        <TouchableOpacity
          style={[
            styles.header,
            sizeStyles[size].header,
            variantStyles[variant].header,
            {
              opacity: isDisabled ? 0.5 : 1,
            },
          ]}
          onPress={() => !isDisabled && toggleItem(item.id)}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          <View style={styles.headerContent}>
            <Text
              style={[
                styles.title,
                sizeStyles[size].title,
                {
                  color: isDisabled ? c.textMuted : c.text,
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                },
              ]}
            >
              {item.title}
            </Text>
            <View
              style={[
                styles.icon,
                {
                  transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
                },
              ]}
            >
              <Text
                style={{
                  color: isDisabled ? c.textMuted : c.primary,
                  fontSize: TYPOGRAPHY.fontSize.lg,
                }}
              >
                ⌄
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View
            style={[
              styles.content,
              sizeStyles[size].content,
              variantStyles[variant].content,
            ]}
          >
            {item.content}
          </View>
        )}
      </View>
    );
  };

  return <View style={styles.container}>{items.map(renderItem)}</View>;
}

const styles = StyleSheet.create({
  container: {
    // Container styles handled by variant
  },
  header: {
    justifyContent: "center",
    ...Platform.select({
      web: {
        cursor: "pointer",
      },
    }),
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    flex: 1,
  },
  icon: {
    marginLeft: SPACING.sm,
  },
  content: {
    // Content styles handled by variant and size
  },
});
