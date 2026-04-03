import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { useOrgTheme } from "@/shared/theme/useOrgTheme";
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from "@/shared/theme/tokens";

type CustomSwitchProps = {
  label?: string;
  checked?: boolean;
  onCheckedChange?: (value: boolean) => void;
  disabled?: boolean;
  style?: any;
};

export function CustomSwitch({
  label,
  checked = false,
  onCheckedChange,
  disabled = false,
  style,
}: CustomSwitchProps) {
  const c = useColors();
  const { primaryColor } = useOrgTheme();

  const handlePress = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: disabled ? c.textMuted : c.text,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.switch,
          {
            backgroundColor: checked
              ? disabled
                ? c.textMuted
                : primaryColor
              : disabled
                ? c.backgroundStrong
                : c.border,
            borderColor: checked
              ? disabled
                ? c.textMuted
                : primaryColor
              : c.border,
          },
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked, disabled }}
      >
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: "#FFFFFF",
              transform: [{ translateX: checked ? 20 : 2 }],
            },
          ]}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  label: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    ...Platform.select({
      web: {
        userSelect: "none",
        cursor: "default",
      },
    }),
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    justifyContent: "center",
    ...Platform.select({
      web: {
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      },
    }),
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: BORDER_RADIUS.full,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    ...Platform.select({
      web: {
        transition: "transform 0.2s ease-in-out",
      },
    }),
  },
});
