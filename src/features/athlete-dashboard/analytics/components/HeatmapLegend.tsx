import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useColors } from "@/shared/hooks/useColors";
import { useClientTheme } from "@/shared/theme/useClientTheme";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { intensityColor } from "../utils/heatmapUtils";

const STEPS = [0, 0.2, 0.45, 0.7, 1];
const CELL = 13;
const GAP = 3;

export function HeatmapLegend() {
  const c = useColors();
  const { primaryColor } = useClientTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: c.textMuted }]}>Less</Text>
      <Svg width={(CELL + GAP) * STEPS.length} height={CELL}>
        {STEPS.map((ratio, i) => {
          const fakeVolume = ratio === 0 ? 0 : ratio * 10000;
          const fill = intensityColor(fakeVolume, 10000, primaryColor, c.backgroundStrong);
          return (
            <Rect
              key={i}
              x={i * (CELL + GAP)}
              y={0}
              width={CELL}
              height={CELL}
              rx={2}
              fill={fill}
            />
          );
        })}
      </Svg>
      <Text style={[styles.label, { color: c.textMuted }]}>More</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
});
