import { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Platform,
  type TextInputProps,
} from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { useOrgTheme } from "@/shared/theme/useOrgTheme";
import { componentStyles, commonStyles } from "@/shared/theme/styles";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

type InputSize = "sm" | "md" | "lg";

type CustomInputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export function CustomInput({
  label,
  error,
  hint,
  size = "md",
  leftIcon,
  rightIcon,
  style,
  ...inputProps
}: CustomInputProps) {
  const [focused, setFocused] = useState(false);
  const c = useColors();
  const { primaryColor } = useOrgTheme();

  const sizeStyles = {
    sm: {
      height: 36,
      paddingHorizontal: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
    },
    md: {
      height: 44,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
    },
    lg: {
      height: 52,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
    },
  };

  const borderColor = error ? c.danger : focused ? primaryColor : c.border;
  const hasError = !!error;

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: hasError ? c.danger : c.text,
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <View style={styles.inputContainer}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            componentStyles.inputBase,
            sizeStyles[size],
            {
              backgroundColor: c.background,
              borderColor,
              color: c.text,
              fontSize: TYPOGRAPHY.fontSize.md,
              flex: 1,
              borderWidth: focused || hasError ? 2 : 1,
            },
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={c.textPlaceholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          accessibilityHint={hint}
          accessibilityState={{ disabled: inputProps.editable === false }}
          {...inputProps}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {(error ?? hint) && (
        <Text
          style={[
            styles.hint,
            {
              color: hasError ? c.danger : c.textMuted,
              fontSize: TYPOGRAPHY.fontSize.xs,
            },
          ]}
        >
          {error ?? hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  label: {
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputWithLeftIcon: {
    paddingLeft: SPACING.xs,
  },
  inputWithRightIcon: {
    paddingRight: SPACING.xs,
  },
  leftIcon: {
    marginRight: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  rightIcon: {
    marginLeft: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    marginTop: SPACING.xs,
    ...Platform.select({
      web: {
        userSelect: "none",
      },
    }),
  },
});
