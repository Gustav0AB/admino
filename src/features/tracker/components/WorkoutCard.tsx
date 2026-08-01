import { Badge, Card } from "@/shared/ui";
import type { WorkoutOfDay, WorkoutStatus } from "@/shared/store/trackerStore";

type Props = {
  workout: WorkoutOfDay;
};

const STATUS_MAP: Record<WorkoutStatus, "gray" | "blue" | "green" | "yellow"> = {
  pending: "gray",
  in_progress: "blue",
  completed: "green",
  modified: "yellow",
};

export function WorkoutCard({ workout }: Props) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500">
            {new Date(workout.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">{workout.title}</h2>
        </div>
        <Badge color={STATUS_MAP[workout.status]}>{workout.status.replace("_", " ")}</Badge>
      </div>

      {workout.status === "modified" && (
        <div className="mt-3 inline-flex rounded-md border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-800">
          ⚡ Coach updated this plan live
        </div>
      )}

      {workout.description && <p className="mt-3 text-sm text-gray-500">{workout.description}</p>}

      <div className="mt-4 divide-y divide-gray-100 border-t border-gray-200">
        {workout.exercises.map((exercise, index) => (
          <div key={exercise.id} className="flex items-center gap-3 py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">{exercise.name}</p>
              <p className="text-xs text-gray-500">{exercise.sets} sets × {exercise.reps} reps</p>
            </div>
            {exercise.notes && <p className="max-w-[12rem] truncate text-right text-xs text-gray-400">{exercise.notes}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}
