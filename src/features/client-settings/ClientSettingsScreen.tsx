import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FeatureShell } from "@/shared/components/shell/FeatureShell";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { ColorPicker } from "@/shared/components/inputs/ColorPicker";
import { StatusBadge } from "@/shared/components/data-display/StatusBadge";
import { Avatar } from "@/shared/components/data-display/Avatar";
import { useColors } from "@/shared/hooks/useColors";
import { useClientStore } from "@/shared/store/clientStore";
import { ENV } from "@/shared/config/env";
import { httpClient } from "@/shared/api/client";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import {
  mockOrgMembers,
} from "@/shared/api/mocks/member";
import type {
  OrgMember,
  CreateMemberInput,
  UpdateMemberInput,
} from "@/shared/types/member";
import { MemberFormModal } from "./MemberFormModal";
import { ChangePasswordSection } from "@/shared/components/inputs/ChangePasswordSection";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const TABS = [
  { key: "branding", label: "Branding" },
  { key: "members", label: "Usuarios" },
  { key: "security", label: "Seguridad" },
];

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Miembro",
};

export function ClientSettingsScreen() {
  const c = useColors();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("branding");

  // Branding state — initialised from store
  const { branding, setBranding } = useClientStore();
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(branding.secondaryColor);
  const [backgroundColor, setBackgroundColor] = useState(branding.backgroundColor);
  const [logoPreview, setLogoPreview] = useState<string | null>(branding.logoUrl);
  const [brandingSaved, setBrandingSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Members
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<OrgMember | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: members = [], isLoading: membersLoading } = useQuery<OrgMember[]>({
    queryKey: ["org-members"],
    queryFn: async () => {
      if (ENV.USE_MOCK) {
        await delay(600);
        return mockOrgMembers;
      }
      const res = await httpClient<{ data: OrgMember[] }>("/clients/members");
      return res.data;
    },
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMember = useMutation({
    mutationFn: async (data: CreateMemberInput) => {
      if (ENV.USE_MOCK) {
        await delay(700);
        const newMember: OrgMember = {
          id: `mem-${Date.now()}`,
          name: data.name,
          username: data.username,
          role: data.role,
          isActive: true,
          permissions: data.permissions,
          createdAt: new Date().toISOString(),
        };
        return newMember;
      }
      const res = await httpClient<{ data: OrgMember }>("/clients/members", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data;
    },
    onSuccess: (newMember) => {
      queryClient.setQueryData<OrgMember[]>(["org-members"], (old = []) => [newMember, ...old]);
      setMemberModalOpen(false);
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMemberInput }) => {
      if (ENV.USE_MOCK) {
        await delay(500);
        return { id, ...data };
      }
      const res = await httpClient<{ data: OrgMember }>(`/clients/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return res.data;
    },
    onSuccess: (_, { id, data }) => {
      queryClient.setQueryData<OrgMember[]>(["org-members"], (old = []) =>
        (old ?? []).map((m) => (m.id === id ? { ...m, ...data } : m))
      );
      setMemberModalOpen(false);
      setEditingMember(null);
    },
  });

  const toggleMemberActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (ENV.USE_MOCK) {
        await delay(400);
        return { id, isActive };
      }
      await httpClient(`/clients/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      return { id, isActive };
    },
    onSuccess: (_, { id, isActive }) => {
      queryClient.setQueryData<OrgMember[]>(["org-members"], (old = []) =>
        (old ?? []).map((m) => (m.id === id ? { ...m, isActive } : m))
      );
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  function openEdit(member: OrgMember) {
    setEditingMember(member);
    setMemberModalOpen(true);
  }

  function openCreate() {
    setEditingMember(null);
    setMemberModalOpen(true);
  }

  function handleMemberSubmit(data: CreateMemberInput | UpdateMemberInput) {
    if (editingMember) {
      updateMember.mutate({ id: editingMember.id, data: data as UpdateMemberInput });
    } else {
      createMember.mutate(data as CreateMemberInput);
    }
  }

  function confirmToggle(member: OrgMember) {
    const action = member.isActive ? "desactivar" : "activar";
    Alert.alert(
      `¿${member.isActive ? "Desactivar" : "Activar"} usuario?`,
      `Esto ${action}á a ${member.name}.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: member.isActive ? "Desactivar" : "Activar",
          style: member.isActive ? "destructive" : "default",
          onPress: () => toggleMemberActive.mutate({ id: member.id, isActive: !member.isActive }),
        },
      ]
    );
  }

  function handleColorChange(key: "primaryColor" | "secondaryColor" | "backgroundColor", value: string) {
    if (key === "primaryColor") setPrimaryColor(value);
    if (key === "secondaryColor") setSecondaryColor(value);
    if (key === "backgroundColor") setBackgroundColor(value);
    // Real-time update
    setBranding({ [key]: value });
  }

  function handleLogoFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLogoPreview(dataUrl);
      setBranding({ logoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  function openFilePicker() {
    if (Platform.OS === "web" && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function saveBranding() {
    // Already live — just show confirmation
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 2000);
  }

  // ── Tabs content ───────────────────────────────────────────────────────────
  const renderBranding = () => (
    <View style={styles.tabContent}>
      {/* Hidden web file input */}
      {Platform.OS === "web" && (
        // @ts-expect-error – web-only
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          style={{ display: "none" }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleLogoFile(file);
          }}
        />
      )}

      <View style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Identidad visual</Text>
        <Text style={[styles.sectionHint, { color: c.textMuted }]}>
          Personaliza el logo y los colores. Los cambios se aplican en tiempo real.
        </Text>

        <View style={styles.fields}>
          {/* Logo upload */}
          <View style={styles.logoSection}>
            <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Logo</Text>
            <View style={styles.logoRow}>
              <View style={[styles.logoBox, { borderColor: c.border, backgroundColor: c.background }]}>
                {logoPreview ? (
                  <Image source={{ uri: logoPreview }} style={styles.logoImage} resizeMode="contain" />
                ) : (
                  <Text style={[styles.logoInitial, { color: c.primary }]}>
                    {branding.orgName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.logoActions}>
                <CustomButton onPress={openFilePicker} type="secondary">
                  Subir imagen (JPG/PNG)
                </CustomButton>
                {logoPreview && (
                  <TouchableOpacity
                    onPress={() => {
                      setLogoPreview(null);
                      setBranding({ logoUrl: null });
                    }}
                  >
                    <Text style={[styles.removeText, { color: c.danger }]}>Eliminar logo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Color pickers */}
          <ColorPicker
            label="Color primario"
            value={primaryColor}
            onChange={(v) => handleColorChange("primaryColor", v)}
          />
          <ColorPicker
            label="Color secundario"
            value={secondaryColor}
            onChange={(v) => handleColorChange("secondaryColor", v)}
          />
          <ColorPicker
            label="Color de fondo"
            value={backgroundColor}
            onChange={(v) => handleColorChange("backgroundColor", v)}
          />

          <CustomButton onPress={saveBranding}>
            {brandingSaved ? "¡Cambios guardados!" : "Confirmar cambios"}
          </CustomButton>
        </View>
      </View>
    </View>
  );

  const renderMembers = () => (
    <View style={styles.tabContent}>
      {membersLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : (
        <View style={styles.memberList}>
          {members.length === 0 && (
            <Text style={{ color: c.textMuted, textAlign: "center", paddingVertical: SPACING.xl }}>
              Sin usuarios
            </Text>
          )}
          {members.map((member) => (
            <View
              key={member.id}
              style={[
                styles.memberRow,
                {
                  backgroundColor: c.backgroundStrong,
                  borderColor: c.border,
                  opacity: member.isActive ? 1 : 0.6,
                },
              ]}
            >
              <Avatar name={member.name} size="sm" />

              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <Text style={[styles.memberName, { color: c.text }]} numberOfLines={1}>
                    {member.name}
                  </Text>
                  <StatusBadge
                    status={member.isActive ? "active" : "cancelled"}
                    customLabel={member.isActive ? "Activo" : "Inactivo"}
                    size="sm"
                  />
                </View>
                <Text style={[{ color: c.textMuted, fontSize: TYPOGRAPHY.fontSize.xs }]} numberOfLines={1}>
                  {member.username}
                </Text>
                <Text style={[{ color: c.primary, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "500" }]}>
                  {ROLE_LABEL[member.role] ?? member.role}
                </Text>
              </View>

              <View style={styles.memberActions}>
                {member.role !== "OWNER" && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: c.border, backgroundColor: c.background }]}
                      onPress={() => openEdit(member)}
                    >
                      <Text style={[styles.actionBtnText, { color: c.text }]}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        {
                          borderColor: member.isActive ? c.danger + "60" : c.border,
                          backgroundColor: member.isActive ? c.danger + "10" : c.background,
                        },
                      ]}
                      onPress={() => confirmToggle(member)}
                    >
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: member.isActive ? c.danger : c.textMuted },
                        ]}
                      >
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
  );

  return (
    <>
      <FeatureShell
        title="Configuración"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        saveActions={
          activeTab === "members"
            ? [{ label: "Agregar usuario", type: "primary", onClick: openCreate }]
            : []
        }
      >
        {activeTab === "branding" ? renderBranding() : activeTab === "members" ? renderMembers() : (
          <View style={styles.tabContent}>
            <ChangePasswordSection />
          </View>
        )}
      </FeatureShell>

      <MemberFormModal
        open={memberModalOpen}
        onClose={() => {
          setMemberModalOpen(false);
          setEditingMember(null);
        }}
        member={editingMember}
        onSubmit={handleMemberSubmit}
        isLoading={createMember.isPending || updateMember.isPending}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    padding: SPACING.md,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  sectionHint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  fields: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
    marginBottom: SPACING.xs,
  },
  logoSection: {
    gap: SPACING.xs,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flexWrap: "wrap",
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  logoInitial: {
    fontSize: 28,
    fontWeight: "800",
  },
  logoActions: {
    gap: SPACING.sm,
    flex: 1,
  },
  removeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  center: {
    paddingVertical: SPACING.xl,
    alignItems: "center",
  },
  memberList: {
    gap: SPACING.sm,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    flexWrap: "wrap",
  },
  memberName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "600",
    flexShrink: 1,
  },
  memberActions: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  actionBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: "500",
  },
});
