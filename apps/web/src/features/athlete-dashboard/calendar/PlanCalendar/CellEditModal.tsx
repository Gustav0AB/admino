import { useEffect, useState } from "react";
import { Button, Modal } from "@/shared/ui";

type CellEditModalProps = {
  open: boolean;
  dateLabel: string;
  initialValue: string;
  onClose: () => void;
  onSave: (text: string) => void;
};

export const CELL_HINT = `Estructura del día para el atleta:
• Línea 1: título del día (ej. "Fuerza")
• Líneas siguientes: cada ejercicio en una línea → se convierte en ítem del checklist
• trote [2x4] 40min → sección de cardio con temporizador
• nota: mensaje → instrucción extra del entrenador

Ejemplo:
Fuerza
pecho banca plana 2 series de 4
trote 2x4 40min
nota: calentar 10 min antes`;

export function CellEditModal({ open, dateLabel, initialValue, onClose, onSave }: CellEditModalProps) {
  const [value, setValue] = useState(initialValue);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  return (
    <Modal open={open} onClose={onClose} title={dateLabel} footer={<><Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button><Button size="sm" onClick={() => { onSave(value); onClose(); }}>Guardar</Button></>}>
      <div className="flex flex-col gap-3">
        <textarea
          className="min-h-52 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={"Fuerza\npecho banca plana 2 series de 4\ntrote 2x4 40min\nnota: calentar bien"}
        />
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <button type="button" className="text-xs font-semibold text-primary" onClick={() => setShowHint((current) => !current)}>{showHint ? "Ocultar formato" : "Ver formato del atleta"}</button>
          {showHint && <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-gray-500">{CELL_HINT}</pre>}
        </div>
      </div>
    </Modal>
  );
}
