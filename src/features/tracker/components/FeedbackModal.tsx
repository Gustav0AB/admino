import { Button, Modal } from "@generic/components";
import { useTrackerStore } from "@/shared/store/trackerStore";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

const RPE_LABELS: Record<number, string> = {
  1: "Very easy",
  2: "Easy",
  3: "Moderate",
  4: "Somewhat hard",
  5: "Hard",
  6: "Harder",
  7: "Very hard",
  8: "Very very hard",
  9: "Maximal",
  10: "Absolute max",
};

function rpeClass(value: number) {
  if (value <= 3) return "bg-green-500 border-green-500 text-white";
  if (value <= 6) return "bg-amber-500 border-amber-500 text-white";
  return "bg-red-500 border-red-500 text-white";
}

export function FeedbackModal({ open, onOpenChange, onSubmit }: Props) {
  const { rpe, feedbackNotes, setRpe, setFeedbackNotes } = useTrackerStore();

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title="Log Workout Feedback"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={rpe === null}>Complete Workout</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">Rate of Perceived Exertion</h3>
          <p className="mt-1 text-xs text-gray-500">
            {rpe !== null ? `${rpe} — ${RPE_LABELS[rpe]}` : "Select how hard it felt (1–10)"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => {
            const selected = rpe === value;
            return (
              <button
                key={value}
                type="button"
                className={`h-12 w-12 rounded-lg border text-sm font-semibold ${selected ? rpeClass(value) : "border-gray-200 bg-gray-50 text-gray-900"}`}
                onClick={() => setRpe(value)}
              >
                {value}
              </button>
            );
          })}
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Notes</span>
          <textarea
            className="min-h-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="How did the session feel? Any pain or wins to note..."
            value={feedbackNotes}
            onChange={(event) => setFeedbackNotes(event.target.value)}
          />
        </label>
      </div>
    </Modal>
  );
}
