import { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FeatureShell } from "@/shared/components/shell/FeatureShell";
import { Avatar } from "@/shared/components/data-display/Avatar";
import { StatusBadge } from "@/shared/components/data-display/StatusBadge";
import { useColors } from "@/shared/hooks/useColors";
import { ENV } from "@/shared/config/env";
import { httpClient } from "@/shared/api/client";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { EndUserFormModal } from "./EndUserFormModal";
import type {
  EndUserMember,
  CreateEndUserMemberInput,
  UpdateEndUserMemberInput,
} from "@/shared/types/member";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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

export function EndUsersScreen() {
  const c = useColors();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<EndUserMember | null>(null);

  const { data: members = [], isLoading } = useQuery<EndUserMember[]>({
    queryKey: ["end-user-members"],
    queryFn: async () => {
      if (ENV.USE_MOCK) { await delay(600); return []; }
      const res = await httpClient<{ data: EndUserMember[] }>("/members");
      return res.data;
    },
  });

  const createMember = useMutation({
    mutationFn: async (data: CreateEndUserMemberInput) => {
      if (ENV.USE_MOCK) {
        await delay(700);
        return { id: `eu-${Date.now()}`, ...data, email: "", isActive: true, joinedAt: new Date().toISOString() } as EndUserMember;
      }
      const res = await httpClient<{ data: EndUserMember }>("/members", { method: "POST", body: data });
      return res.data;
    },
    onSuccess: (m) => {
      queryClient.setQueryData<EndUserMember[]>(["end-user-members"], (old = []) => [m, ...old]);
      setModalOpen(false);
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEndUserMemberInput }) => {
      if (ENV.USE_MOCK) { await delay(500); return { id, ...data } as EndUserMember; }
      const res = await httpClient<{ data: EndUserMember }>(`/members/${id}`, { method: "PATCH", body: data });
      return res.data;
    },
    onSuccess: (updated, { id }) => {
      queryClient.setQueryData<EndUserMember[]>(["end-user-members"], (old = []) =>
        old.map((m) => (m.id === id ? { ...m, ...updated } : m))
      );
      setModalOpen(false);
      setEditingMember(null);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (ENV.USE_MOCK) { await delay(400); return { id, isActive }; }
      await httpClient(`/members/${id}`, { method: "PATCH", body: { isActive } });
      return { id, isActive };
    },
    onSuccess: (_, { id, isActive }) => {
      queryClient.setQueryData<EndUserMember[]>(["end-user-members"], (old = []) =>
        old.map((m) => (m.id === id ? { ...m, isActive } : m))
      );
    },
  });

  function confirmToggle(member: EndUserMember) {
    Alert.alert(
      `¿${member.isActive ? "Desactivar" : "Activar"} miembro?`,
      `Esto ${member.isActive ? "desactivará" : "activará"} a ${member.name} ${member.lastname}.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: member.isActive ? "Desactivar" : "Activar",
          style: member.isActive ? "destructive" : "default",
          onPress: () => toggleActive.mutate({ id: member.id, isActive: !member.isActive }),
        },
      ]
    );
  }

  function handleSubmit(data: CreateEndUserMemberInput | UpdateEndUserMemberInput) {
    if (editingMember) {
      updateMember.mutate({ id: editingMember.id, data: data as UpdateEndUserMemberInput });
    } else {
      createMember.mutate(data as CreateEndUserMemberInput);
    }
  }

  return (
    <>
      <FeatureShell
        title="Miembros"
        tabs={[]}
        activeTab=""
        onTabChange={() => {}}
        saveActions={[{ label: "Agregar miembro", type: "primary", onClick: () => { setEditingMember(null); setModalOpen(true); } }]}
      >
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.center}><ActivityIndicator color={c.primary} /></View>
          ) : (
            <View style={styles.list}>
              {members.length === 0 && (
                <Text style={{ color: c.textMuted, textAlign: "center", paddingVertical: SPACING.xl }}>
                  Sin miembros
                </Text>
              )}
              {members.map((member) => {
                const age = calcAge(member.birthdate);
                return (
                  <View
                    key={member.id}
                    style={[styles.row, { backgroundColor: c.backgroundStrong, borderColor: c.border, opacity: member.isActive ? 1 : 0.6 }]}
                  >
                    <Avatar name={`${member.name} ${member.lastname}`} size="sm" />
                    <View style={styles.info}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
                          {member.name} {member.lastname}
                        </Text>
                        <StatusBadge
                          status={member.isActive ? "active" : "cancelled"}
                          customLabel={member.isActive ? "Activo" : "Inactivo"}
                          size="sm"
                        />
                      </View>
                      {age !== null && (
                        <Text style={{ color: c.textMuted, fontSize: TYPOGRAPHY.fontSize.xs }}>{age} años</Text>
                      )}
                      {member.username && (
                        <Text style={{ color: c.primary, fontSize: TYPOGRAPHY.fontSize.xs }}>@{member.username}</Text>
                      )}
                    </View>
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: c.border, backgroundColor: c.background }]}
                        onPress={() => { setEditingMember(member); setModalOpen(true); }}
                      >
                        <Text style={[styles.actionBtnText, { color: c.text }]}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: member.isActive ? c.danger + "60" : c.border, backgroundColor: member.isActive ? c.danger + "10" : c.background }]}
                        onPress={() => confirmToggle(member)}
                      >
                        <Text style={[styles.actionBtnText, { color: member.isActive ? c.danger : c.textMuted }]}>
                          {member.isActive ? "Desactivar" : "Activar"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </FeatureShell>

      <EndUserFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingMember(null); }}
        member={editingMember}
        onSubmit={handleSubmit}
        isLoading={createMember.isPending || updateMember.isPending}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md },
  list: { gap: SPACING.sm },
  center: { paddingVertical: SPACING.xl, alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1 },
  info: { flex: 1, gap: 2, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, flexWrap: "wrap" },
  name: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600", flexShrink: 1 },
  actions: { flexDirection: "row", gap: SPACING.xs },
  actionBtn: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.sm, borderWidth: 1 },
  actionBtnText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "500" },
});
