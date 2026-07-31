import { useEffect, useState } from "react";
import { Button, DatePicker, Modal, TextField } from "@generic/components";
import { CELL_HINT } from "./CellEditModal";

type RepeatPatternModalProps = {
  open: boolean;
  defaultStartDate: string;
  onClose: () => void;
  onSave: (templates: string[], startDateIso: string) => void;
};

const MIN_TEMPLATES = 2;

export function RepeatPatternModal({ open, defaultStartDate, onClose, onSave }: RepeatPatternModalProps) {
  const [templates, setTemplates] = useState<string[]>(["", ""]);
  const [startDate, setStartDate] = useState(defaultStartDate);

  useEffect(() => {
    if (open) {
      setTemplates(["", ""]);
      setStartDate(defaultStartDate);
    }
  }, [open, defaultStartDate]);

  return (
    <Modal open={open} onClose={onClose} title="Patrón repetitivo" footer={<><Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button><Button size="sm" onClick={() => { onSave(templates, startDate); onClose(); }}>Aplicar al plan</Button></>}>
      <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
        <p className="text-sm leading-5 text-gray-500">Define un ciclo de días y se repetirá automáticamente desde la fecha de inicio hasta el fin del plan.</p>
        <DatePicker label="Empezar el ciclo desde" value={startDate} onChange={setStartDate} locale="es-MX" placeholder="Seleccionar fecha" clearText="Limpiar" />
        {templates.map((text, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 flex justify-between gap-3">
              <p className="text-sm font-semibold text-gray-900">Día {index + 1} del ciclo</p>
              {templates.length > MIN_TEMPLATES && <button type="button" className="text-xs font-semibold text-red-600" onClick={() => setTemplates((current) => current.filter((_, i) => i !== index))}>Quitar</button>}
            </div>
            <textarea className="min-h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" value={text} onChange={(event) => setTemplates((current) => current.map((item, i) => i === index ? event.target.value : item))} placeholder={"Pull\njalón al pecho 4x10\nremo 4x10"} />
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={() => setTemplates((current) => [...current, ""])}>+ Agregar día al ciclo</Button>
        <pre className="rounded-lg border border-gray-200 bg-gray-50 p-3 whitespace-pre-wrap text-xs leading-5 text-gray-500">{CELL_HINT}</pre>
      </div>
    </Modal>
  );
}
