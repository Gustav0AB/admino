import { useTrackerStore } from "@/shared/store/trackerStore";

export function StreakBadge() {
  const streak = useTrackerStore((state) => state.streak);

  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2">
      <span className="text-2xl">🔥</span>
      <div>
        <p className="text-sm font-semibold text-gray-900">{streak}</p>
        <p className="text-xs text-gray-500">day streak</p>
      </div>
    </div>
  );
}
