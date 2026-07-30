import { View, Text, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from "@/shared/theme/tokens";

const RPE_LABELS: Record<number, string> = {
  1: "Muy fácil",
  2: "Fácil",
  3: "Moderado",
  4: "Algo difícil",
  5: "Difícil",
  6: "Más difícil",
  7: "Muy difícil",
  8: "Muy muy difícil",
  9: "Máximo",
  10: "Al límite",
};

function rpeColor(value: number): string {
  if (value <= 3) return "#22C55E";
  if (value <= 6) return "#F59E0B";
  return "#EF4444";
}

type RpeSelectorProps = {
  value: number | null;
  onChange: (value: number) => void;
};

export function RpeSelector({ value, onChange }: RpeSelectorProps) {
  const c = useColors();

  return (
    <View style={{ gap: SPACING.sm }}>
      <Text style={{ color: c.textMuted, fontSize: TYPOGRAPHY.fontSize.sm }}>
        {value !== null ? `${value} — ${RPE_LABELS[value]}` : "¿Qué tan duro se sintió? (1-10)"}
      </Text>
      <View style={styles.grid}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => {
          const selected = value === v;
          return (
            <Pressable
              key={v}
              onPress={() => onChange(v)}
              accessibilityRole="button"
              accessibilityLabel={`RPE ${v}`}
              accessibilityState={{ selected }}
              style={[
                styles.btn,
                {
                  backgroundColor: selected ? rpeColor(v) : c.backgroundStrong,
                  borderColor: selected ? rpeColor(v) : c.border,
                },
              ]}
            >
              <Text style={{ color: selected ? "#fff" : c.text, fontWeight: "700" }}>{v}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  btn: { width: 44, height: 44, borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
});
