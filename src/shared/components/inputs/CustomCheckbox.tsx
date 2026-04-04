import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

type CheckboxOption = {
  label: string;
  value: string | number;
};

type CustomCheckboxProps = {
  label?: string;
  options?: CheckboxOption[];
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  values?: (string | number)[];
  onValuesChange?: (values: (string | number)[]) => void;
  error?: string;
  disabled?: boolean;
  direction?: "vertical" | "horizontal";
  style?: StyleProp<ViewStyle>;
};

export function CustomCheckbox({
  label,
  options,
  checked,
  onCheckedChange,
  values,
  onValuesChange,
  error,
  disabled = false,
  direction = "vertical",
  style,
}: CustomCheckboxProps) {
  const c = useColors();

  const isMultiple = options && values !== undefined && onValuesChange;

  const handleSingleToggle = () => {
    if (onCheckedChange && checked !== undefined) {
      onCheckedChange(!checked);
    }
  };

  const handleMultipleToggle = (optionValue: string | number) => {
    if (values && onValuesChange) {
      const newValues = values.includes(optionValue)
        ? values.filter((v) => v !== optionValue)
        : [...values, optionValue];
      onValuesChange(newValues);
    }
  };

  if (isMultiple && options) {
    return (
      <View style={[styles.container, style]}>
        {label && (
          <Text style={[styles.label, { color: c.text }]}>{label}</Text>
        )}

        <View
          style={[
            styles.optionsContainer,
            {
              flexDirection: direction === "horizontal" ? "row" : "column",
              gap: direction === "horizontal" ? SPACING.md : SPACING.sm,
            },
          ]}
        >
          {options.map((option) => {
            const isChecked = values?.includes(option.value) || false;
            return (
              <TouchableOpacity
                key={option.value.toString()}
                style={[
                  styles.option,
                  {
                    opacity: disabled ? 0.5 : 1,
                  },
                ]}
                onPress={() => !disabled && handleMultipleToggle(option.value)}
                disabled={disabled}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: isChecked ? c.primary : c.border,
                      backgroundColor: isChecked ? c.primary : c.background,
                    },
                  ]}
                >
                  {isChecked && (
                    <Text style={[styles.checkmark, { color: c.white }]}>
                      ✓
                    </Text>
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
            );
          })}
        </View>

        {error && (
          <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
        )}
      </View>
    );
  }

  // Single checkbox
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.option,
          {
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onPress={() => !disabled && handleSingleToggle()}
        disabled={disabled}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: checked ? c.primary : c.border,
              backgroundColor: checked ? c.primary : c.background,
            },
          ]}
        >
          {checked && (
            <Text style={[styles.checkmark, { color: c.white }]}>✓</Text>
          )}
        </View>
        {label && (
          <Text
            style={[
              styles.optionText,
              {
                color: disabled ? c.textMuted : c.text,
              },
            ]}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>

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
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  checkmark: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  optionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
  },
});
