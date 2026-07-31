import { useState } from "react";
import { Button, DatePicker, Dropdown, Modal, TextField } from "@generic/components";
import type { CalendarEvent, EventType } from "./types";

const EVENT_TYPE_OPTIONS: { label: string; value: EventType }[] = [
  { label: "Competencia", value: "competition" },
  { label: "Seminario", value: "seminar" },
  { label: "Vacaciones", value: "vacation" },
];

type AddEventModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
};

export function AddEventModal({ open, onClose, onSave }: AddEventModalProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<EventType>("competition");
  const [nameError, setNameError] = useState("");
  const [dateError, setDateError] = useState("");

  function handleClose() {
    setName("");
    setDate("");
    setType("competition");
    setNameError("");
    setDateError("");
    onClose();
  }

  function handleSave() {
    const validName = name.trim();
    setNameError(validName ? "" : "El nombre es obligatorio");
    setDateError(date ? "" : "La fecha es obligatoria");
    if (!validName || !date) return;
    onSave({ id: `ev-${Date.now()}`, name: validName, date, type });
    handleClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Agregar evento" footer={<><Button variant="ghost" size="sm" onClick={handleClose}>Cancelar</Button><Button size="sm" onClick={handleSave}>Guardar evento</Button></>}>
      <div className="flex flex-col gap-4">
        <TextField label="Nombre del evento" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Campeonato Regional" error={nameError} />
        <div>
          <DatePicker label="Fecha" value={date} onChange={setDate} locale="es-MX" placeholder="Seleccionar fecha" clearText="Limpiar" />
          {dateError && <p className="field-error">{dateError}</p>}
        </div>
        <Dropdown label="Tipo" options={EVENT_TYPE_OPTIONS} value={type} onChange={(value) => setType(value as EventType)} />
      </div>
    </Modal>
  );
}
