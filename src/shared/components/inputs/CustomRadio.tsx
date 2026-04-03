import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

type RadioOption = {
  label: string;
  value: string | number;
};

type CustomRadioProps = {
  label?: string;
  options: RadioOption[];
  value?: string | number;
  onValueChange: (value: string | number) => void;
  error?: string;
  disabled?: boolean;
  direction?: "vertical" | "horizontal";
};

export function CustomRadio({
  label,
  options,
  value,
  onValueChange,
  error,
  disabled = false,
  direction = "vertical",
}: CustomRadioProps) {
  const c = useColors();

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: c.text }]}>{label}</Text>}

      <View
        style={[
          styles.optionsContainer,
          {
            flexDirection: direction === "horizontal" ? "row" : "column",
            gap: direction === "horizontal" ? SPACING.md : SPACING.sm,
          },
        ]}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.value.toString()}
            style={[
              styles.option,
              {
                opacity: disabled ? 0.5 : 1,
              },
            ]}
            onPress={() => !disabled && onValueChange(option.value)}
            disabled={disabled}
          >
            <View
              style={[
                styles.radio,
                {
                  borderColor: value === option.value ? c.primary : c.border,
                  backgroundColor:
                    value === option.value ? c.primary : c.background,
                },
              ]}
            >
              {value === option.value && (
                <View
                  style={[styles.radioInner, { backgroundColor: c.white }]}
                />
              )}
            </View>
            <Text
              style={[
                styles.optionText,
                {
                  color: disabled ? c.textMuted : c.text,
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
  optionsContainer: {
    marginTop: SPACING.xs,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      web: {
        cursor: "pointer",
      },
    }),
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  optionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
  },
});
