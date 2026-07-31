import { useState } from "react";
import { Card } from "@generic/components";
import { useHeatmapData } from "./hooks/useHeatmap";
import { DayDetailModal } from "./components/DayDetailModal";
import { Heatmap } from "./components/Heatmap";
import { HeatmapLegend } from "./components/HeatmapLegend";
import { HeatmapSkeleton } from "./components/HeatmapSkeleton";
import { totalVolumeFormatted } from "./utils/heatmapUtils";

export function AnalyticsScreen() {
  const { data, isLoading } = useHeatmapData();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const activeDays = data?.days.filter((day) => day.volume > 0).length ?? 0;
  const totalVolume = data?.days.reduce((sum, day) => sum + day.volume, 0) ?? 0;
  const longestStreak = data ? computeStreak(data.days) : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-gray-50 p-4">
      <header className="border-b border-gray-200 pb-3">
        <h1 className="text-xl font-bold text-gray-900">Activity</h1>
        <p className="text-sm text-gray-500">Last 12 months</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Active days" value={String(activeDays)} />
        <StatCard label="Total volume" value={`${totalVolumeFormatted(totalVolume)} kg`} />
        <StatCard label="Best streak" value={`${longestStreak} days`} />
      </div>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-gray-900">Workout Volume</h2>
            <HeatmapLegend />
          </div>
          <div className="overflow-x-auto">
            {isLoading || !data ? <HeatmapSkeleton /> : <Heatmap days={data.days} maxVolume={data.maxVolume} onDayPress={setSelectedDate} />}
          </div>
        </div>
      </Card>

      <DayDetailModal date={selectedDate} onClose={() => setSelectedDate(null)} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return <Card className="text-center"><p className="text-lg font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></Card>;
}

function computeStreak(days: { date: string; volume: number }[]) {
  let streak = 0;
  for (const day of [...days].sort((a, b) => b.date.localeCompare(a.date))) {
    if (day.volume > 0) streak++;
    else break;
  }
  return streak;
}
