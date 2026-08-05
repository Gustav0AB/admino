import { Button, DatePicker, Dropdown, TextField } from "@/shared/ui";
import type { CalendarPlan } from "./types";

export type EditMode = "view" | "new" | "edit";

type ToolbarProps = {
  plans: CalendarPlan[];
  selectedPlanId: string | null;
  editMode: EditMode;
  draftName: string;
  draftStartDate: string;
  draftEndDate: string;
  totalWeeks: number | null;
  weeksToNext: number | null;
  saveError: string | null;
  isSaving: boolean;
  showRepeatPattern: boolean;
  onSelectPlan: (id: string | null) => void;
  onNewPlan: () => void;
  onDraftNameChange: (value: string) => void;
  onDraftStartChange: (value: string) => void;
  onDraftEndChange: (value: string) => void;
  onSave: () => void;
  onAddEvent: () => void;
  onOpenRepeatPattern: () => void;
  onDownloadPdf: () => void;
};

export function Toolbar({
  plans,
  selectedPlanId,
  editMode,
  draftName,
  draftStartDate,
  draftEndDate,
  totalWeeks,
  weeksToNext,
  saveError,
  isSaving,
  showRepeatPattern,
  onSelectPlan,
  onNewPlan,
  onDraftNameChange,
  onDraftStartChange,
  onDraftEndChange,
  onSave,
  onAddEvent,
  onOpenRepeatPattern,
  onDownloadPdf,
}: ToolbarProps) {
  const showSave = editMode === "new" || editMode === "edit";
  const showForm = showSave;

  return (
    <div className="calendar-toolbar">
      <div className="calendar-toolbar-row">
        <div className="calendar-plan-select">
          <Dropdown
            options={[{ label: "Sin plan", value: "" }, ...plans.map((plan) => ({ label: plan.name, value: plan.id }))]}
            value={selectedPlanId ?? ""}
            onChange={(value) => onSelectPlan(value ? value : null)}
            placeholder="Seleccionar plan..."
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onNewPlan}>Nuevo plan</Button>
        {showSave && <Button size="sm" loading={isSaving} onClick={onSave}>Guardar plan</Button>}
        <Button variant="ghost" size="sm" onClick={onAddEvent}>Evento</Button>
        {showRepeatPattern && <Button variant="ghost" size="sm" onClick={onOpenRepeatPattern}>Patrón repetitivo</Button>}
        {selectedPlanId && <Button variant="ghost" size="sm" onClick={onDownloadPdf}>⬇ PDF</Button>}
      </div>

      {showForm && (
        <div className="calendar-form-grid">
          <TextField label="Nombre del plan" value={draftName} onChange={(event) => onDraftNameChange(event.target.value)} placeholder="Ej. Macrociclo Mayo" error={saveError && !draftName.trim() ? "Obligatorio" : undefined} />
          <DatePicker label="Fecha inicio" value={draftStartDate} onChange={onDraftStartChange} />
          <DatePicker label="Fecha fin" value={draftEndDate} onChange={onDraftEndChange} />
        </div>
      )}

      {saveError && <div className="form-error">{saveError}</div>}
      {(totalWeeks !== null || weeksToNext !== null) && (
        <div className="calendar-stats">
          {totalWeeks !== null && <StatPill value={String(totalWeeks)} label={totalWeeks === 1 ? "semana" : "semanas"} />}
          {weeksToNext !== null && <StatPill value={String(weeksToNext)} label="sem. hasta próximo evento" />}
        </div>
      )}
    </div>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return <span><strong>{value}</strong> <span>{label}</span></span>;
}
