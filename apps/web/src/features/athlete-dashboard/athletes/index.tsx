import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, Dropdown, TextField } from "@/shared/ui";
import { httpClient } from "@/shared/api/client";
import { ENV } from "@/shared/config/env";
import type { AthleteCategory, EndUserMember, TrainingPlan, UpdateEndUserMemberInput } from "@/shared/types/member";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const CATEGORIA_OPTIONS: { label: string; value: AthleteCategory }[] = [
  { label: "Principiante", value: "principiante" },
  { label: "Intermedio", value: "intermedio" },
  { label: "Avanzado", value: "avanzado" },
  { label: "Semi-profesional", value: "semi-profesional" },
  { label: "Profesional", value: "profesional" },
];
const CATEGORIA_FILTER_OPTIONS = [{ label: "Todas las categorías", value: "" }, ...CATEGORIA_OPTIONS];

function calcAge(birthdate: string | null) {
  if (!birthdate) return null;
  const dob = new Date(`${birthdate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const month = today.getMonth() - dob.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : null;
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function AthleteRow({
  athlete,
  plans,
  assignedPlanId,
  onSaveData,
  onAssignPlan,
  onUnassignPlan,
  isSaving,
}: {
  athlete: EndUserMember;
  plans: TrainingPlan[];
  assignedPlanId: string | null;
  onSaveData: (id: string, data: UpdateEndUserMemberInput) => void;
  onAssignPlan: (memberId: string, planId: string) => void;
  onUnassignPlan: (memberId: string, planId: string) => void;
  isSaving: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [peso, setPeso] = useState(athlete.peso?.toString() ?? "");
  const [altura, setAltura] = useState(athlete.altura?.toString() ?? "");
  const [categoria, setCategoria] = useState<AthleteCategory | "">(athlete.categoria ?? "");
  const [grado, setGrado] = useState(athlete.grado ?? "");
  const age = calcAge(athlete.birthdate);
  const currentPlanName = assignedPlanId ? plans.find((plan) => plan.id === assignedPlanId)?.name ?? "Plan asignado" : null;

  function handleSave() {
    onSaveData(athlete.id, {
      peso: peso ? Number(peso) : null,
      altura: altura ? Number(altura) : null,
      categoria: categoria || null,
      grado: grado || null,
    });
  }

  function handlePlanChange(planId: string) {
    if (planId) onAssignPlan(athlete.id, planId);
    else if (assignedPlanId) onUnassignPlan(athlete.id, assignedPlanId);
  }

  return (
    <Card padding="sm">
      <button type="button" className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 text-left" onClick={() => setExpanded((value) => !value)}>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{initials(`${athlete.name} ${athlete.lastname}`)}</span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-gray-900">{athlete.name} {athlete.lastname}</span>
            {athlete.username && <span className="text-xs text-primary">@{athlete.username}</span>}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {age !== null && <span>{age} años</span>}
            {athlete.categoria && <Badge color="blue">{athlete.categoria}</Badge>}
            {athlete.peso && <span>{athlete.peso}kg</span>}
            {currentPlanName && <Badge>{currentPlanName}</Badge>}
          </span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <Badge color={athlete.isActive ? "green" : "red"}>{athlete.isActive ? "Activo" : "Inactivo"}</Badge>
          <span className="text-xs text-gray-500">{expanded ? "Ocultar" : "Ver"}</span>
        </span>
      </button>

      {expanded && (
        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Datos del atleta</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Peso (kg)" type="number" value={peso} onChange={(event) => setPeso(event.target.value)} placeholder="70.5" />
            <TextField label="Altura (cm)" type="number" value={altura} onChange={(event) => setAltura(event.target.value)} placeholder="175" />
          </div>
          <Dropdown label="Categoría" value={categoria} options={CATEGORIA_OPTIONS} onChange={(value) => setCategoria(value as AthleteCategory)} placeholder="Seleccionar categoría" />
          <TextField label="Grado" value={grado} onChange={(event) => setGrado(event.target.value)} placeholder="Cinturón negro, nivel 3, etc." />
          {athlete.username && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Plan de entrenamiento</p>
              <Dropdown label="Asignar plan" value={assignedPlanId ?? ""} options={[{ label: "Sin plan", value: "" }, ...plans.map((plan) => ({ label: plan.name, value: plan.id }))]} onChange={handlePlanChange} />
            </>
          )}
          <Button size="sm" className="self-start" loading={isSaving} loadingText="Guardando..." onClick={handleSave}>Guardar datos</Button>
        </div>
      )}
    </Card>
  );
}

function TrackerTab({ athletes, plans }: { athletes: EndUserMember[]; plans: TrainingPlan[] }) {
  const [selectedId, setSelectedId] = useState("");
  const selectedAthlete = athletes.find((athlete) => athlete.id === selectedId) ?? null;
  const assignedPlan = selectedAthlete?.trainingPlanId ? plans.find((plan) => plan.id === selectedAthlete.trainingPlanId) ?? null : null;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-gray-200 bg-white p-4">
        <Dropdown value={selectedId} options={[{ label: "Seleccionar atleta...", value: "" }, ...athletes.map((athlete) => ({ label: `${athlete.name} ${athlete.lastname}`, value: athlete.id }))]} onChange={setSelectedId} />
      </div>
      {!selectedAthlete ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-gray-500">Selecciona un atleta para ver su actividad.</div>
      ) : (
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          <Card>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-bold text-white">{initials(`${selectedAthlete.name} ${selectedAthlete.lastname}`)}</span>
              <div>
                <p className="font-semibold text-gray-900">{selectedAthlete.name} {selectedAthlete.lastname}</p>
                {selectedAthlete.categoria && <p className="text-xs text-gray-500">{selectedAthlete.categoria}</p>}
                <div className="mt-1 flex gap-2">{selectedAthlete.peso && <Badge color="blue">{selectedAthlete.peso}kg</Badge>}{selectedAthlete.altura && <Badge color="blue">{selectedAthlete.altura}cm</Badge>}</div>
              </div>
            </div>
          </Card>
          <Card>
            {assignedPlan ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Plan asignado</p>
                <p className="font-semibold text-gray-900">{assignedPlan.name}</p>
                {assignedPlan.startDate && <p className="text-xs text-gray-500">{assignedPlan.startDate} → {assignedPlan.endDate}</p>}
                {assignedPlan.cells?.[today] ? <div className="rounded-lg bg-blue-50 p-3 text-sm text-gray-900"><p className="mb-1 font-semibold text-primary">Hoy</p>{assignedPlan.cells[today]}</div> : <p className="text-sm italic text-gray-500">Sin actividad registrada para hoy.</p>}
              </div>
            ) : (
              <p className="text-sm italic text-gray-500">Sin plan asignado.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export function AthletesTab() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"general" | "tracker">("general");
  const [localAssignments, setLocalAssignments] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");

  const { data: athletes = [], isLoading: athletesLoading } = useQuery<EndUserMember[]>({
    queryKey: ["athletes"],
    queryFn: async () => {
      if (ENV.USE_MOCK) { await delay(600); return []; }
      const res = await httpClient<{ data: EndUserMember[] }>("/members");
      return res.data;
    },
  });
  const { data: plans = [] } = useQuery<TrainingPlan[]>({
    queryKey: ["training-plans"],
    queryFn: async () => {
      if (ENV.USE_MOCK) return [];
      const res = await httpClient<{ data: TrainingPlan[] }>("/training-plans");
      return res.data;
    },
  });

  const updateAthlete = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEndUserMemberInput }) => {
      if (ENV.USE_MOCK) { await delay(500); return; }
      await httpClient(`/members/${id}`, { method: "PATCH", body: data });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["athletes"] }),
  });
  const assignPlan = useMutation({
    mutationFn: async ({ memberId, planId }: { memberId: string; planId: string }) => {
      if (ENV.USE_MOCK) { await delay(400); return; }
      await httpClient("/training-plans/assign", { method: "POST", body: { memberId, planId } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["athletes"] }),
  });
  const unassignPlan = useMutation({
    mutationFn: async ({ memberId, planId }: { memberId: string; planId: string }) => {
      if (ENV.USE_MOCK) { await delay(400); return; }
      await httpClient(`/training-plans/assign/${memberId}/${planId}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["athletes"] }),
  });

  const filteredAthletes = athletes.filter((athlete) => {
    const fullName = `${athlete.name} ${athlete.lastname}`.toLowerCase();
    return (!search || fullName.includes(search.toLowerCase()) || (athlete.username ?? "").toLowerCase().includes(search.toLowerCase())) &&
      (!filterCategoria || athlete.categoria === filterCategoria);
  });

  function handleAssign(memberId: string, planId: string) {
    assignPlan.mutate({ memberId, planId });
    setLocalAssignments((prev) => ({ ...prev, [memberId]: planId }));
  }

  function handleUnassign(memberId: string, planId: string) {
    unassignPlan.mutate({ memberId, planId });
    setLocalAssignments((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
  }

  if (athletesLoading) return <div className="page empty-state">Cargando…</div>;

  return (
    <div className="page feature-page">
      <header className="feature-header">
        <h1 className="page-title">Planes · Atletas</h1>
      </header>
      <div className="tabs">
        {(["general", "tracker"] as const).map((tab) => (
          <button key={tab} type="button" className={`tab ${activeTab === tab ? "tab-active" : ""}`} onClick={() => setActiveTab(tab)}>
            {tab === "general" ? "General" : "Actividad"}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === "general" ? (
          <>
          <div className="filter-bar">
            <TextField value={search} onChange={(event) => setSearch(event.target.value)} placeholder="🔍 Buscar atleta..." />
            <Dropdown value={filterCategoria} options={CATEGORIA_FILTER_OPTIONS} onChange={setFilterCategoria} />
          </div>
          <div className="stack-list">
            {filteredAthletes.length === 0 ? (
              <div className="empty-state">{athletes.length === 0 ? "Sin atletas registrados. Añade miembros desde Configuración → Miembros." : "Sin resultados para la búsqueda."}</div>
            ) : filteredAthletes.map((athlete) => (
              <AthleteRow
                key={athlete.id}
                athlete={athlete}
                plans={plans}
                assignedPlanId={localAssignments[athlete.id] ?? athlete.trainingPlanId ?? null}
                onSaveData={(id, data) => updateAthlete.mutate({ id, data })}
                onAssignPlan={handleAssign}
                onUnassignPlan={handleUnassign}
                isSaving={updateAthlete.isPending}
              />
            ))}
          </div>
          </>
        ) : (
          <TrackerTab athletes={athletes} plans={plans} />
        )}
      </div>
    </div>
  );
}
