import { useState } from "react";
import { View, TextInput, Text, StyleSheet, type TextInputProps } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { useOrgTheme } from "@/shared/theme/useOrgTheme";

type CustomInputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
};

export function CustomInput({ label, error, hint, style, ...inputProps }: CustomInputProps) {
  const [focused, setFocused] = useState(false);
  const c = useColors();
  const { primaryColor } = useOrgTheme();

  const borderColor = error ? c.danger : focused ? primaryColor : c.border;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: c.text }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: c.background,
            borderColor,
            color: c.text,
          },
          style,
        ]}
        placeholderTextColor={c.textPlaceholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        accessibilityHint={hint}
        {...inputProps}
      />
      {(error ?? hint) && (
        <Text style={[styles.hint, { color: error ? c.danger : c.textMuted }]}>
          {error ?? hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 16, fontWeight: "600" },
  input: {
    height: 44,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  hint: { fontSize: 12 },
});
