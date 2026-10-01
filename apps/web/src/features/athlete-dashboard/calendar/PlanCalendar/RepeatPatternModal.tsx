import { useEffect, useState } from "react";
import { Button, DatePicker, Modal } from "@/shared/ui";
import { CELL_HINT } from "./CellEditModal";

type RepeatPatternModalProps = {
  open: boolean;
  defaultStartDate: string;
  onClose: () => void;
  onSave: (templates: string[], startDateIso: string, restWeekdays: number[]) => void;
};

const MIN_TEMPLATES = 2;
const WEEKDAYS = [
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
  { label: "Domingo", value: 0 },
];

export function RepeatPatternModal({
  open,
  defaultStartDate,
  onClose,
  onSave,
}: RepeatPatternModalProps) {
  const [templates, setTemplates] = useState<string[]>(["", ""]);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [restWeekdays, setRestWeekdays] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      setTemplates(["", ""]);
      setStartDate(defaultStartDate);
      setRestWeekdays([]);
    }
  }, [open, defaultStartDate]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Patrón repetitivo"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSave(templates, startDate, restWeekdays);
              onClose();
            }}
          >
            Aplicar al plan
          </Button>
        </>
      }
    >
      <div className="flex max-h-[65vh] flex-col   overflow-y-auto pr-1">
        <p className="text-sm leading-5 text-gray-500">
          Define un ciclo de entrenamientos. Los días de descanso se saltan sin
          avanzar el ciclo.
        </p>
        <DatePicker
          label="Empezar el ciclo desde"
          value={startDate}
          onChange={setStartDate}
        />
        <fieldset className="rounded-lg border border-gray-200 p-3">
          <legend className="px-1 text-sm font-semibold text-gray-900">
            Días de descanso
          </legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {WEEKDAYS.map((day) => (
              <label key={day.value} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={restWeekdays.includes(day.value)}
                  onChange={() =>
                    setRestWeekdays((current) =>
                      current.includes(day.value)
                        ? current.filter((value) => value !== day.value)
                        : [...current, day.value],
                    )
                  }
                />
                {day.label}
              </label>
            ))}
          </div>
        </fieldset>
        {templates.map((text, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 flex justify-between gap-3">
              <p className="text-sm font-semibold text-gray-900">
                Día {index + 1} del ciclo
              </p>
              {templates.length > MIN_TEMPLATES && (
                <button
                  type="button"
                  className="text-xs font-semibold text-red-600"
                  onClick={() =>
                    setTemplates((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                >
                  Quitar
                </button>
              )}
            </div>
            <textarea
              className="min-h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              value={text}
              onChange={(event) =>
                setTemplates((current) =>
                  current.map((item, i) =>
                    i === index ? event.target.value : item,
                  ),
                )
              }
              placeholder={"Pull\njalón al pecho 4x10\nremo 4x10"}
            />
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTemplates((current) => [...current, ""])}
        >
          Agregar día al ciclo
        </Button>
        <pre className="rounded-lg border border-gray-200 bg-gray-50 p-3 whitespace-pre-wrap text-xs leading-5 text-gray-500">
          {CELL_HINT}
        </pre>
      </div>
    </Modal>
  );
}
