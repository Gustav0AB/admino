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
import { mockOrgMembers } from "@/shared/api/mocks/member";
import type { OrgMember, CreateMemberInput, UpdateMemberInput } from "@/shared/types/member";
import { MemberFormModal } from "@/features/client-settings/MemberFormModal";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  MEMBER: "Miembro",
};

export function OrgMembersScreen() {
  const c = useColors();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<OrgMember | null>(null);

  const { data: members = [], isLoading } = useQuery<OrgMember[]>({
    queryKey: ["org-members"],
    queryFn: async () => {
      if (ENV.USE_MOCK) { await delay(600); return mockOrgMembers; }
      const res = await httpClient<{ data: OrgMember[] }>("/clients/members");
      return res.data;
    },
  });

  const createMember = useMutation({
    mutationFn: async (data: CreateMemberInput) => {
      if (ENV.USE_MOCK) {
        await delay(700);
        return { id: `mem-${Date.now()}`, name: data.name, username: data.username, role: data.role, isActive: true, permissions: data.permissions, createdAt: new Date().toISOString() } as OrgMember;
      }
      const res = await httpClient<{ data: OrgMember }>("/clients/members", { method: "POST", body: data });
      return res.data;
    },
    onSuccess: (m) => {
      queryClient.setQueryData<OrgMember[]>(["org-members"], (old = []) => [m, ...old]);
      setModalOpen(false);
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMemberInput }) => {
      if (ENV.USE_MOCK) { await delay(500); return { id, ...data }; }
      const res = await httpClient<{ data: OrgMember }>(`/clients/members/${id}`, { method: "PATCH", body: data });
      return res.data;
    },
    onSuccess: (_, { id, data }) => {
      queryClient.setQueryData<OrgMember[]>(["org-members"], (old = []) => (old ?? []).map((m) => (m.id === id ? { ...m, ...data } : m)));
      setModalOpen(false);
      setEditingMember(null);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (ENV.USE_MOCK) { await delay(400); return { id, isActive }; }
      await httpClient(`/clients/members/${id}`, { method: "PATCH", body: { isActive } });
      return { id, isActive };
    },
    onSuccess: (_, { id, isActive }) => {
      queryClient.setQueryData<OrgMember[]>(["org-members"], (old = []) => (old ?? []).map((m) => (m.id === id ? { ...m, isActive } : m)));
    },
  });

  function confirmToggle(member: OrgMember) {
    Alert.alert(
      `¿${member.isActive ? "Desactivar" : "Activar"} usuario?`,
      `Esto ${member.isActive ? "desactivará" : "activará"} a ${member.name}.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: member.isActive ? "Desactivar" : "Activar", style: member.isActive ? "destructive" : "default", onPress: () => toggleActive.mutate({ id: member.id, isActive: !member.isActive }) },
      ]
    );
  }

  function handleSubmit(data: CreateMemberInput | UpdateMemberInput) {
    if (editingMember) {
      updateMember.mutate({ id: editingMember.id, data: data as UpdateMemberInput });
    } else {
      createMember.mutate(data as CreateMemberInput);
    }
  }

  return (
    <>
      <FeatureShell
        title="Usuarios"
        tabs={[]}
        activeTab=""
        onTabChange={() => {}}
        saveActions={[{ label: "Agregar usuario", type: "primary", onClick: () => { setEditingMember(null); setModalOpen(true); } }]}
      >
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.center}><ActivityIndicator color={c.primary} /></View>
          ) : (
            <View style={styles.list}>
              {members.length === 0 && (
                <Text style={{ color: c.textMuted, textAlign: "center", paddingVertical: SPACING.xl }}>Sin usuarios</Text>
              )}
              {members.map((member) => (
                <View
                  key={member.id}
                  style={[styles.row, { backgroundColor: c.backgroundStrong, borderColor: c.border, opacity: member.isActive ? 1 : 0.6 }]}
                >
                  <Avatar name={member.name} size="sm" />
                  <View style={styles.info}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>{member.name}</Text>
                      <StatusBadge status={member.isActive ? "active" : "cancelled"} customLabel={member.isActive ? "Activo" : "Inactivo"} size="sm" />
                    </View>
                    <Text style={[{ color: c.textMuted, fontSize: TYPOGRAPHY.fontSize.xs }]} numberOfLines={1}>{member.username}</Text>
                    <Text style={[{ color: c.primary, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "500" }]}>
                      {ROLE_LABEL[member.role] ?? member.role}
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    {member.role !== "OWNER" && (
                      <>
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
                      </>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </FeatureShell>

      <MemberFormModal
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
