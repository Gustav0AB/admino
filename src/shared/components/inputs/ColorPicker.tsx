import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";

const PRESETS = [
  "#2563EB", "#7C3AED", "#DB2777", "#DC2626",
  "#EA580C", "#CA8A04", "#16A34A", "#0891B2",
  "#0F172A", "#374151", "#6B7280", "#FFFFFF",
];

type Props = {
  label: string;
  value: string;
  onChange: (color: string) => void;
};

export function ColorPicker({ label, value, onChange }: Props) {
  const c = useColors();
  const [hex, setHex] = useState(value);

  function applyHex(raw: string) {
    const v = raw.startsWith("#") ? raw : `#${raw}`;
    setHex(v);
    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(v)) {
      onChange(v);
    }
  }

  function syncFromParent() {
    setHex(value);
  }

  return (
    <View style={styles.root}>
      <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>

      {/* Native color input on web */}
      {Platform.OS === "web" && (
        <View style={styles.nativeRow}>
          {/* @ts-expect-error – web-only input type */}
          <input
            type="color"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onChange(e.target.value);
              setHex(e.target.value);
            }}
            style={{
              width: 40,
              height: 40,
              border: "none",
              padding: 0,
              cursor: "pointer",
              borderRadius: 8,
              background: "none",
            }}
          />
          <TextInput
            style={[
              styles.hexInput,
              {
                color: c.text,
                borderColor: c.border,
                backgroundColor: c.backgroundStrong,
              },
            ]}
            value={hex}
            onChangeText={applyHex}
            onBlur={syncFromParent}
            placeholder="#000000"
            placeholderTextColor={c.textPlaceholder}
            autoCapitalize="none"
            maxLength={7}
          />
          <View style={[styles.swatch, { backgroundColor: value }]} />
        </View>
      )}

      {/* Presets */}
      <View style={styles.presets}>
        {PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[
              styles.preset,
              { backgroundColor: preset, borderColor: preset === value ? c.text : "transparent" },
            ]}
            onPress={() => {
              onChange(preset);
              setHex(preset);
            }}
          />
        ))}
      </View>

      {/* Hex input (native fallback / always shown) */}
      {Platform.OS !== "web" && (
        <View style={styles.nativeRow}>
          <View style={[styles.swatch, { backgroundColor: value }]} />
          <TextInput
            style={[
              styles.hexInput,
              {
                color: c.text,
                borderColor: c.border,
                backgroundColor: c.backgroundStrong,
                flex: 1,
              },
            ]}
            value={hex}
            onChangeText={applyHex}
            onBlur={syncFromParent}
            placeholder="#000000"
            placeholderTextColor={c.textPlaceholder}
            autoCapitalize="none"
            maxLength={7}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: SPACING.xs },
  label: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "500" },
  nativeRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  swatch: { width: 40, height: 40, borderRadius: BORDER_RADIUS.sm },
  hexInput: {
    height: 40,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: "monospace",
    minWidth: 100,
  },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  preset: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
  },
});
