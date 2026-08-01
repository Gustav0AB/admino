import { Modal } from "@/shared/ui";
import { useWorkoutLog } from "../hooks/useHeatmap";
import { formatDisplayDate, totalVolumeFormatted } from "../utils/heatmapUtils";

type DayDetailModalProps = {
  date: string | null;
  onClose: () => void;
};

export function DayDetailModal({ date, onClose }: DayDetailModalProps) {
  const { data: log, isLoading } = useWorkoutLog(date);

  return (
    <Modal open={date !== null} onClose={onClose} title={date ? formatDisplayDate(date) : ""}>
      {isLoading && <div className="py-8 text-center text-gray-500">Cargando…</div>}
      {!isLoading && !log && (
        <div className="py-8 text-center">
          <p className="text-3xl">🏖</p>
          <p className="font-semibold text-gray-900">Rest day</p>
          <p className="text-sm text-gray-500">No workout logged for this day.</p>
        </div>
      )}
      {!isLoading && log && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-3">
            <Stat label="Title" value={log.title} />
            <Stat label="Volume" value={`${totalVolumeFormatted(log.totalVolume)} kg`} />
            <Stat label="Duration" value={`${log.duration} min`} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Exercises</p>
          <div className="flex flex-col divide-y divide-gray-100">
            {log.exercises.map((exercise, index) => (
              <div key={index} className="grid gap-2 py-3 text-sm sm:grid-cols-[2fr_2fr_1fr]">
                <p className="font-medium text-gray-900">{exercise.name}</p>
                <p className="text-gray-500">{exercise.sets} × {exercise.reps} @ {exercise.weight} {exercise.unit}</p>
                <p className="text-right font-bold text-primary">{totalVolumeFormatted(exercise.sets * exercise.reps * exercise.weight)} {exercise.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="text-center"><p className="text-xs font-semibold uppercase text-gray-500">{label}</p><p className="text-sm font-bold text-gray-900">{value}</p></div>;
}
