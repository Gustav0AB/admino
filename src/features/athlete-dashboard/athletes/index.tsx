import { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/shared/hooks/useColors";
import { httpClient } from "@/shared/api/client";
import { ENV } from "@/shared/config/env";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { Avatar } from "@/shared/components/data-display/Avatar";
import { StatusBadge } from "@/shared/components/data-display/StatusBadge";
import { CustomSelect } from "@/shared/components/inputs/CustomSelect";
import { CustomInput } from "@/shared/components/inputs/CustomInput";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import type { EndUserMember, TrainingPlan, AthleteCategory, UpdateEndUserMemberInput } from "@/shared/types/member";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const CATEGORIA_OPTIONS = [
  { label: "Principiante", value: "principiante" },
  { label: "Intermedio", value: "intermedio" },
  { label: "Avanzado", value: "avanzado" },
  { label: "Semi-profesional", value: "semi-profesional" },
  { label: "Profesional", value: "profesional" },
];

const CATEGORIA_FILTER_OPTIONS = [
  { label: "Todas las categorías", value: "" },
  ...CATEGORIA_OPTIONS,
];

function calcAge(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const dob = new Date(birthdate.slice(0, 10) + "T12:00:00");
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : null;
}

// ── Athlete Row ────────────────────────────────────────────────────────────────

type AthleteRowProps = {
  athlete: EndUserMember;
  plans: TrainingPlan[];
  assignedPlanId: string | null;
  onSaveData: (id: string, data: UpdateEndUserMemberInput) => void;
  onAssignPlan: (memberId: string, planId: string) => void;
  onUnassignPlan: (memberId: string, planId: string) => void;
  isSaving: boolean;
};

function AthleteRow({ athlete, plans, assignedPlanId, onSaveData, onAssignPlan, onUnassignPlan, isSaving }: AthleteRowProps) {
  const c = useColors();
  const [expanded, setExpanded] = useState(false);
  const [peso, setPeso] = useState(athlete.peso?.toString() ?? "");
  const [altura, setAltura] = useState(athlete.altura?.toString() ?? "");
  const [categoria, setCategoria] = useState<AthleteCategory | "">(athlete.categoria ?? "");
  const [grado, setGrado] = useState(athlete.grado ?? "");
  const [selectedPlan, setSelectedPlan] = useState(assignedPlanId ?? "");

  const age = calcAge(athlete.birthdate);

  function handleSave() {
    onSaveData(athlete.id, {
      peso: peso ? parseFloat(peso) : null,
      altura: altura ? parseFloat(altura) : null,
      categoria: (categoria as AthleteCategory) || null,
      grado: grado || null,
    });
  }

  function handlePlanChange(planId: string) {
    setSelectedPlan(planId);
    if (planId) {
      onAssignPlan(athlete.id, planId);
    } else if (assignedPlanId) {
      onUnassignPlan(athlete.id, assignedPlanId);
    }
  }

  const planOptions = [
    { label: "Sin plan", value: "" },
    ...plans.map((p) => ({ label: p.name, value: p.id })),
  ];

  const currentPlanName = assignedPlanId
    ? plans.find((p) => p.id === assignedPlanId)?.name ?? "Plan asignado"
    : null;

  return (
    <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded((v) => !v)}>
        <Avatar name={`${athlete.name} ${athlete.lastname}`} size="sm" />
        <View style={styles.athleteInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.athleteName, { color: c.text }]} numberOfLines={1}>
              {athlete.name} {athlete.lastname}
            </Text>
            {athlete.username && (
              <Text style={[styles.username, { color: c.primary }]}>@{athlete.username}</Text>
            )}
          </View>
          <View style={styles.metaRow}>
            {age !== null && <Text style={[styles.meta, { color: c.textMuted }]}>{age} años</Text>}
            {athlete.categoria && (
              <Text style={[styles.metaBadge, { backgroundColor: c.primary + "20", color: c.primary }]}>
                {athlete.categoria}
              </Text>
            )}
            {athlete.peso && (
              <Text style={[styles.meta, { color: c.textMuted }]}>{athlete.peso}kg</Text>
            )}
            {currentPlanName && (
              <Text style={[styles.metaBadge, { backgroundColor: c.backgroundHover ?? c.border, color: c.textMuted }]} numberOfLines={1}>
                📋 {currentPlanName}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.cardRight}>
          <StatusBadge status={athlete.isActive ? "active" : "cancelled"} customLabel={athlete.isActive ? "Activo" : "Inactivo"} size="sm" />
          <Text style={{ color: c.textMuted, fontSize: 12 }}>{expanded ? "▲" : "▼"}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.panel, { borderTopColor: c.border }]}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Datos del atleta</Text>

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <CustomInput label="Peso (kg)" value={peso} onChangeText={setPeso} placeholder="70.5" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <CustomInput label="Altura (cm)" value={altura} onChangeText={setAltura} placeholder="175" keyboardType="decimal-pad" />
            </View>
          </View>

          <CustomSelect
            label="Categoría"
            value={categoria}
            options={CATEGORIA_OPTIONS}
            onChange={(v) => setCategoria(v as AthleteCategory)}
            placeholder="Seleccionar categoría"
          />

          <CustomInput label="Grado" value={grado} onChangeText={setGrado} placeholder="Cinturón negro, nivel 3, etc." />

          {athlete.username && (
            <>
              <Text style={[styles.sectionLabel, { color: c.textMuted, marginTop: SPACING.xs }]}>Plan de entrenamiento</Text>
              <CustomSelect
                label="Asignar plan"
                value={selectedPlan}
                options={planOptions}
                onChange={(v) => handlePlanChange(String(v))}
                placeholder="Sin plan asignado"
              />
            </>
          )}

          <CustomButton onPress={handleSave} loading={isSaving} size="sm">
            Guardar datos
          </CustomButton>
        </View>
      )}
    </View>
  );
}

// ── Tracker Tab ────────────────────────────────────────────────────────────────

function TrackerTab({ athletes, plans }: { athletes: EndUserMember[]; plans: TrainingPlan[] }) {
  const c = useColors();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedAthlete = athletes.find((a) => a.id === selectedId) ?? null;
  const assignedPlan = selectedAthlete?.trainingPlanId
    ? plans.find((p) => p.id === selectedAthlete.trainingPlanId) ?? null
    : null;

  const today = new Date().toISOString().slice(0, 10);

  const athleteOptions = athletes.map((a) => ({
    label: `${a.name} ${a.lastname}`,
    value: a.id,
  }));

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.trackerHeader, { borderBottomColor: c.border, backgroundColor: c.backgroundStrong }]}>
        <CustomSelect
          label=""
          value={selectedId ?? ""}
          options={[{ label: "Seleccionar atleta...", value: "" }, ...athleteOptions]}
          onChange={(v) => setSelectedId(String(v) || null)}
          placeholder="Seleccionar atleta..."
        />
      </View>

      {!selectedAthlete ? (
        <View style={styles.center}>
          <Text style={{ color: c.textMuted, textAlign: "center" }}>
            Selecciona un atleta para ver su actividad.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: SPACING.md, gap: SPACING.md }}>
          {/* Athlete summary */}
          <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border, padding: SPACING.md }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
              <Avatar name={`${selectedAthlete.name} ${selectedAthlete.lastname}`} size="md" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.athleteName, { color: c.text }]}>{selectedAthlete.name} {selectedAthlete.lastname}</Text>
                {selectedAthlete.categoria && (
                  <Text style={[styles.meta, { color: c.textMuted }]}>{selectedAthlete.categoria}</Text>
                )}
                <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: 4 }}>
                  {selectedAthlete.peso && <Text style={[styles.metaBadge, { backgroundColor: c.primary + "20", color: c.primary }]}>{selectedAthlete.peso}kg</Text>}
                  {selectedAthlete.altura && <Text style={[styles.metaBadge, { backgroundColor: c.primary + "20", color: c.primary }]}>{selectedAthlete.altura}cm</Text>}
                </View>
              </View>
            </View>
          </View>

          {/* Assigned plan */}
          {assignedPlan ? (
            <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border, padding: SPACING.md, gap: SPACING.sm }]}>
              <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Plan asignado</Text>
              <Text style={[styles.athleteName, { color: c.text }]}>📋 {assignedPlan.name}</Text>
              {assignedPlan.startDate && (
                <Text style={[styles.meta, { color: c.textMuted }]}>{assignedPlan.startDate} → {assignedPlan.endDate}</Text>
              )}

              {/* Today's workout */}
              {assignedPlan.cells?.[today] ? (
                <View style={[{ backgroundColor: c.primary + "10", borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm }]}>
                  <Text style={[styles.sectionLabel, { color: c.primary, marginBottom: 4 }]}>Hoy</Text>
                  <Text style={[{ color: c.text, fontSize: TYPOGRAPHY.fontSize.sm, lineHeight: 20 }]}>
                    {assignedPlan.cells[today]}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.meta, { color: c.textMuted, fontStyle: "italic" }]}>Sin actividad registrada para hoy.</Text>
              )}
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border, padding: SPACING.md }]}>
              <Text style={[{ color: c.textMuted, fontStyle: "italic" }]}>Sin plan asignado.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AthletesTab() {
  const c = useColors();
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

  function handleAssign(memberId: string, planId: string) {
    assignPlan.mutate({ memberId, planId });
    setLocalAssignments((prev) => ({ ...prev, [memberId]: planId }));
  }

  function handleUnassign(memberId: string, planId: string) {
    unassignPlan.mutate({ memberId, planId });
    setLocalAssignments((prev) => { const n = { ...prev }; delete n[memberId]; return n; });
  }

  const filteredAthletes = athletes.filter((a) => {
    const fullName = `${a.name} ${a.lastname}`.toLowerCase();
    const matchSearch = !search || fullName.includes(search.toLowerCase()) || (a.username ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategoria || a.categoria === filterCategoria;
    return matchSearch && matchCat;
  });

  if (athletesLoading) {
    return <View style={styles.center}><ActivityIndicator color={c.primary} /></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: c.border, backgroundColor: c.background }]}>
        {(["general", "tracker"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab ? c.primary : c.textMuted, fontWeight: activeTab === tab ? "600" : "400" }]}>
              {tab === "general" ? "General" : "Tracker"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "general" ? (
        <>
          {/* Search + filter */}
          <View style={[styles.filterRow, { backgroundColor: c.background, borderBottomColor: c.border }]}>
            <View style={[styles.searchBox, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
              <Text style={{ color: c.textMuted, fontSize: 14 }}>🔍</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar atleta..."
                placeholderTextColor={c.textPlaceholder}
                style={{ flex: 1, color: c.text, fontSize: TYPOGRAPHY.fontSize.sm, paddingVertical: 0 }}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Text style={{ color: c.textMuted }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ width: 160 }}>
              <CustomSelect
                label=""
                value={filterCategoria}
                options={CATEGORIA_FILTER_OPTIONS}
                onChange={(v) => setFilterCategoria(String(v))}
                placeholder="Categoría"
              />
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list}>
            {filteredAthletes.length === 0 && (
              <View style={styles.center}>
                <Text style={{ color: c.textMuted, textAlign: "center" }}>
                  {athletes.length === 0
                    ? "Sin atletas registrados.\nAñade miembros desde Configuración → Miembros."
                    : "Sin resultados para la búsqueda."}
                </Text>
              </View>
            )}
            {filteredAthletes.map((athlete) => (
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
          </ScrollView>
        </>
      ) : (
        <TrackerTab athletes={athletes} plans={plans} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: SPACING.md, gap: SPACING.sm, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.xl },
  card: { borderRadius: BORDER_RADIUS.md, borderWidth: 1, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: SPACING.sm, gap: SPACING.sm },
  athleteInfo: { flex: 1, gap: 2, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, flexWrap: "wrap" },
  athleteName: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600", flexShrink: 1 },
  username: { fontSize: TYPOGRAPHY.fontSize.xs },
  metaRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, flexWrap: "wrap" },
  meta: { fontSize: TYPOGRAPHY.fontSize.xs },
  metaBadge: { fontSize: TYPOGRAPHY.fontSize.xs, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm, fontWeight: "500" },
  cardRight: { alignItems: "flex-end", gap: 4 },
  panel: { padding: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth, gap: SPACING.md },
  sectionLabel: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  row2: { flexDirection: "row", gap: SPACING.sm },
  tabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: SPACING.sm, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabLabel: { fontSize: TYPOGRAPHY.fontSize.sm },
  filterRow: { flexDirection: "row", gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: "center" },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACING.xs, borderWidth: 1, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, minHeight: 40 },
  trackerHeader: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: StyleSheet.hairlineWidth },
});
