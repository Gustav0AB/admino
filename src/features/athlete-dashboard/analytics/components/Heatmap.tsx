import { useMemo } from "react";
import { useClientTheme } from "@/shared/theme/useClientTheme";
import type { HeatmapDay } from "../types";
import { DOW_LABELS, buildWeekColumns, getMonthLabels, intensityColor } from "../utils/heatmapUtils";

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
  const { primaryColor } = useClientTheme();
  const columns = useMemo(() => buildWeekColumns(days, 365), [days]);
  const monthLabels = useMemo(() => getMonthLabels(columns), [columns]);
  const svgWidth = DOW_LABEL_WIDTH + columns.length * CELL_STEP;
  const svgHeight = MONTH_LABEL_HEIGHT + 7 * CELL_STEP;

  return (
    <svg width={svgWidth} height={svgHeight} aria-label="Workout volume heatmap">
      {monthLabels.map(({ label, colIndex }) => (
        <text key={`m-${label}-${colIndex}`} x={DOW_LABEL_WIDTH + colIndex * CELL_STEP} y={MONTH_LABEL_HEIGHT - 4} fontSize={10} fill="#6B7280" fontWeight={600}>{label}</text>
      ))}
      {DOW_SHOW.map((dow) => (
        <text key={`dow-${dow}`} x={0} y={MONTH_LABEL_HEIGHT + dow * CELL_STEP + CELL_SIZE - 1} fontSize={9} fill="#6B7280">{DOW_LABELS[dow]?.slice(0, 3)}</text>
      ))}
      {columns.map((column, colIndex) => column.map((cell, rowIndex) => {
        if (cell.date === "" || cell.volume === -1) return null;
        const x = DOW_LABEL_WIDTH + colIndex * CELL_STEP;
        const y = MONTH_LABEL_HEIGHT + rowIndex * CELL_STEP;
        return (
          <rect
            key={`cell-${cell.date}`}
            x={x}
            y={y}
            width={CELL_SIZE}
            height={CELL_SIZE}
            rx={CORNER_RADIUS}
            fill={intensityColor(cell.volume, maxVolume, primaryColor, "#F3F4F6")}
            className={cell.volume > 0 ? "cursor-pointer" : ""}
            onClick={() => cell.volume > 0 && onDayPress(cell.date)}
          />
        );
      }))}
    </svg>
  );
}
