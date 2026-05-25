import { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView,
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

function calcAge(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const dob = new Date(birthdate);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : null;
}

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

export function AthletesTab() {
  const c = useColors();
  const queryClient = useQueryClient();
  const [localAssignments, setLocalAssignments] = useState<Record<string, string>>({});

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
  });

  const unassignPlan = useMutation({
    mutationFn: async ({ memberId, planId }: { memberId: string; planId: string }) => {
      if (ENV.USE_MOCK) { await delay(400); return; }
      await httpClient(`/training-plans/assign/${memberId}/${planId}`, { method: "DELETE" });
    },
  });

  function handleAssign(memberId: string, planId: string) {
    assignPlan.mutate({ memberId, planId });
    setLocalAssignments((prev) => ({ ...prev, [memberId]: planId }));
  }

  function handleUnassign(memberId: string, planId: string) {
    unassignPlan.mutate({ memberId, planId });
    setLocalAssignments((prev) => { const n = { ...prev }; delete n[memberId]; return n; });
  }

  if (athletesLoading) {
    return <View style={styles.center}><ActivityIndicator color={c.primary} /></View>;
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list}>
      {athletes.length === 0 && (
        <View style={styles.center}>
          <Text style={{ color: c.textMuted, textAlign: "center" }}>
            Sin atletas registrados.{"\n"}Añade miembros desde Configuración → Miembros.
          </Text>
        </View>
      )}
      {athletes.map((athlete) => (
        <AthleteRow
          key={athlete.id}
          athlete={athlete}
          plans={plans}
          assignedPlanId={localAssignments[athlete.id] ?? null}
          onSaveData={(id, data) => updateAthlete.mutate({ id, data })}
          onAssignPlan={handleAssign}
          onUnassignPlan={handleUnassign}
          isSaving={updateAthlete.isPending}
        />
      ))}
    </ScrollView>
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
});
