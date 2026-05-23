import { View, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useColors } from "@/shared/hooks/useColors";
import { BREAKPOINTS } from "@/shared/theme/tokens";

const CELL = 13;
const GAP = 3;
const STEP = CELL + GAP;
const DOW_W = 28;
const MONTH_H = 20;
const CORNER = 2;

export function HeatmapSkeleton() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isMobile = width < BREAKPOINTS.tablet;
  const cols = isMobile ? 13 : 53;
  const svgWidth = DOW_W + cols * STEP;
  const svgHeight = MONTH_H + 7 * STEP;

  const cells: { x: number; y: number }[] = [];
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < 7; row++) {
      cells.push({ x: DOW_W + col * STEP, y: MONTH_H + row * STEP });
    }
  }

  return (
    <View style={styles.wrapper}>
      <Svg width={svgWidth} height={svgHeight}>
        {cells.map(({ x, y }, i) => (
          <Rect
            key={i}
            x={x}
            y={y}
            width={CELL}
            height={CELL}
            rx={CORNER}
            fill={c.backgroundStrong}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
  },
});
