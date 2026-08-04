import { useClientTheme } from "@/shared/theme/useClientTheme";
import { intensityColor } from "../utils/heatmapUtils";

const STEPS = [0, 0.2, 0.45, 0.7, 1];

export function HeatmapLegend() {
  const { primaryColor } = useClientTheme();
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      <span>Less</span>
      <svg width={80} height={13}>
        {STEPS.map((ratio, index) => (
          <rect key={ratio} x={index * 16} y={0} width={13} height={13} rx={2} fill={intensityColor(ratio === 0 ? 0 : ratio * 10000, 10000, primaryColor, "#F3F4F6")} />
        ))}
      </svg>
      <span>More</span>
    </div>
  );
}
