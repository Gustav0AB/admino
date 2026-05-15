import { useMemo } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Rect, Text as SvgText, G } from "react-native-svg";
import { useColors } from "@/shared/hooks/useColors";
import { useOrgTheme } from "@/shared/theme/useOrgTheme";
import { BREAKPOINTS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import type { HeatmapDay } from "../types";
import {
  buildWeekColumns,
  getMonthLabels,
  intensityColor,
  DOW_LABELS,
} from "../utils/heatmapUtils";

const CELL_SIZE = 13;
const CELL_GAP = 3;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const DOW_LABEL_WIDTH = 28;
const MONTH_LABEL_HEIGHT = 20;
const CORNER_RADIUS = 2;

const DOW_SHOW = [1, 3, 5];

type HeatmapProps = {
  days: HeatmapDay[];
  maxVolume: number;
  onDayPress: (date: string) => void;
};

export function Heatmap({ days, maxVolume, onDayPress }: HeatmapProps) {
  const c = useColors();
  const { primaryColor } = useOrgTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < BREAKPOINTS.tablet;

  const windowDays = isMobile ? 90 : 365;
  const columns = useMemo(
    () => buildWeekColumns(days, windowDays),
    [days, windowDays]
  );
  const monthLabels = useMemo(() => getMonthLabels(columns), [columns]);

  const svgWidth = DOW_LABEL_WIDTH + columns.length * CELL_STEP;
  const svgHeight = MONTH_LABEL_HEIGHT + 7 * CELL_STEP;

  const emptyColor = c.backgroundStrong;

  return (
    <View style={styles.wrapper}>
      <Svg
        width={svgWidth}
        height={svgHeight}
        accessibilityLabel="Workout volume heatmap"
      >
        {monthLabels.map(({ label, colIndex }) => (
          <SvgText
            key={`m-${label}-${colIndex}`}
            x={DOW_LABEL_WIDTH + colIndex * CELL_STEP}
            y={MONTH_LABEL_HEIGHT - 4}
            fontSize={10}
            fill={c.textMuted}
            fontWeight="600"
          >
            {label}
          </SvgText>
        ))}

        {DOW_SHOW.map((dow) => (
          <SvgText
            key={`dow-${dow}`}
            x={0}
            y={MONTH_LABEL_HEIGHT + dow * CELL_STEP + CELL_SIZE - 1}
            fontSize={9}
            fill={c.textMuted}
          >
            {DOW_LABELS[dow]?.slice(0, 3)}
          </SvgText>
        ))}

        {columns.map((col, colIdx) =>
          col.map((cell, rowIdx) => {
            if (cell.date === "" || cell.volume === -1) {
              return (
                <Rect
                  key={`empty-${colIdx}-${rowIdx}`}
                  x={DOW_LABEL_WIDTH + colIdx * CELL_STEP}
                  y={MONTH_LABEL_HEIGHT + rowIdx * CELL_STEP}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={CORNER_RADIUS}
                  fill="transparent"
                />
              );
            }

            const fill = intensityColor(cell.volume, maxVolume, primaryColor, emptyColor);
            const x = DOW_LABEL_WIDTH + colIdx * CELL_STEP;
            const y = MONTH_LABEL_HEIGHT + rowIdx * CELL_STEP;

            if (cell.volume > 0) {
              return (
                <Rect
                  key={`cell-${cell.date}`}
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={CORNER_RADIUS}
                  fill={fill}
                  onPress={() => onDayPress(cell.date)}
                />
              );
            }

            return (
              <Rect
                key={`cell-${cell.date}`}
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={CORNER_RADIUS}
                fill={fill}
              />
            );
          })
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
  },
});
