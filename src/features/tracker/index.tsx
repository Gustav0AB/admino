import { useEffect, useState } from "react";
import { Button, Card } from "@/shared/ui";
import { useTrackerStore } from "@/shared/store/trackerStore";
import { useWorkoutSocket } from "@/shared/hooks/useWorkoutSocket";
import { StreakBadge } from "./components/StreakBadge";
import { WorkoutCard } from "./components/WorkoutCard";
import { EvidenceUploader } from "./components/EvidenceUploader";
import { FeedbackModal } from "./components/FeedbackModal";

const MOCK_WORKOUT = {
  id: "wod-1",
  title: "Upper Body Power",
  date: new Date().toISOString(),
  description: "Focus on explosive movements and controlled negatives.",
  status: "pending" as const,
  exercises: [
    { id: "e1", name: "Bench Press", sets: 4, reps: 6, notes: "85% 1RM" },
    { id: "e2", name: "Pull-Ups", sets: 4, reps: 8 },
    { id: "e3", name: "Overhead Press", sets: 3, reps: 10, notes: "Controlled descent" },
    { id: "e4", name: "Barbell Row", sets: 3, reps: 10 },
    { id: "e5", name: "Face Pulls", sets: 3, reps: 15, notes: "Light weight" },
  ],
};

export function TrackerScreen() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { workout, setWorkout, completeWorkout, resetFeedback } = useTrackerStore();

  useWorkoutSocket();

  useEffect(() => {
    if (!workout) setWorkout(MOCK_WORKOUT);
  }, [setWorkout, workout]);

  const isCompleted = workout?.status === "completed";

  return (
    <div className="page feature-page">
      <div className="feature-narrow">
        <div className="feature-header">
          <div>
            <p className="eyebrow">Tracker</p>
            <h1 className="page-title">Workout of the Day</h1>
          </div>
          <StreakBadge />
        </div>

        {workout ? (
          <>
            <WorkoutCard workout={workout} />
            <Card>
              <EvidenceUploader />
            </Card>
            {!isCompleted ? (
              <Button size="lg" onClick={() => { resetFeedback(); setFeedbackOpen(true); }}>
                Log Feedback & Complete
              </Button>
            ) : (
              <div className="success-panel">
                ✓ Workout completed — great work!
              </div>
            )}
          </>
        ) : (
          <Card className="text-center">
            <div className="text-4xl">🏋️</div>
            <h2 className="mt-3 font-semibold text-gray-900">No workout scheduled</h2>
            <p className="mt-1 text-sm text-gray-500">Your coach hasn't assigned a workout for today yet. Check back soon.</p>
          </Card>
        )}

        <FeedbackModal
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          onSubmit={() => { completeWorkout(); setFeedbackOpen(false); }}
        />
      </div>
    </div>
  );
}
