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
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

type TextAreaSize = "sm" | "md" | "lg";

type CustomTextAreaProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  size?: TextAreaSize;
  rows?: number;
};

export function CustomTextArea({
  label,
  error,
  hint,
  size = "md",
  rows = 4,
  style,
  ...inputProps
}: CustomTextAreaProps) {
  const [focused, setFocused] = useState(false);
  const c = useColors();

  const sizeStyles = {
    sm: {
      minHeight: 60,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.sm,
    },
    md: {
      minHeight: 80,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.md,
    },
    lg: {
      minHeight: 120,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
    },
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: c.text }]}>{label}</Text>}

      <TextInput
        style={[
          styles.textArea,
          sizeStyles[size],
          {
            backgroundColor: c.background,
            borderColor: error ? c.danger : focused ? c.primary : c.border,
            borderWidth: error || focused ? 2 : 1,
            color: c.text,
          },
          style,
        ]}
        multiline
        numberOfLines={rows}
        textAlignVertical="top"
        placeholderTextColor={c.textPlaceholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...inputProps}
      />

      {hint && !error && (
        <Text style={[styles.hintText, { color: c.textMuted }]}>{hint}</Text>
      )}

      {error && (
        <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
  },
  textArea: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "inherit",
    }),
    ...Platform.select({
      web: {
        outlineStyle: "none",
        resize: "vertical",
      },
    }),
  },
  hintText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
  },
});
