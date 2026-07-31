const RPE_LABELS: Record<number, string> = {
  1: "Muy fácil",
  2: "Fácil",
  3: "Moderado",
  4: "Algo difícil",
  5: "Difícil",
  6: "Más difícil",
  7: "Muy difícil",
  8: "Muy muy difícil",
  9: "Máximo",
  10: "Al límite",
};

function rpeColor(value: number) {
  if (value <= 3) return "#22C55E";
  if (value <= 6) return "#F59E0B";
  return "#EF4444";
}

type RpeSelectorProps = {
  value: number | null;
  onChange: (value: number) => void;
};

export function RpeSelector({ value, onChange }: RpeSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500">
        {value !== null ? `${value} — ${RPE_LABELS[value]}` : "¿Qué tan duro se sintió? (1-10)"}
      </p>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((rpe) => {
          const selected = value === rpe;
          return (
            <button
              key={rpe}
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-lg border-2 font-bold"
              style={{
                backgroundColor: selected ? rpeColor(rpe) : "#fff",
                borderColor: selected ? rpeColor(rpe) : "#E5E7EB",
                color: selected ? "#fff" : "#111827",
              }}
              aria-label={`RPE ${rpe}`}
              aria-pressed={selected}
              onClick={() => onChange(rpe)}
            >
              {rpe}
            </button>
          );
        })}
      </div>
    </div>
  );
}
