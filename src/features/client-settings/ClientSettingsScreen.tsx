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
import type {
  EndUserMember,
  CreateEndUserMemberInput,
  UpdateEndUserMemberInput,
} from "@/shared/types/member";
import { EndUserFormModal } from "./EndUserFormModal";
import { ChangePasswordSection } from "@/shared/components/inputs/ChangePasswordSection";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const TABS = [
  { key: "branding", label: "Apariencia" },
  { key: "endusers", label: "Miembros" },
  { key: "security", label: "Seguridad" },
];

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

  // End-user members (Member)
  const [endUserModalOpen, setEndUserModalOpen] = useState(false);
  const [editingEndUser, setEditingEndUser] = useState<EndUserMember | null>(null);

  // ── End-user queries & mutations ──────────────────────────────────────────
  const { data: endUsers = [], isLoading: endUsersLoading } = useQuery<EndUserMember[]>({
    queryKey: ["end-user-members"],
    queryFn: async () => {
      if (ENV.USE_MOCK) { await delay(600); return []; }
      const res = await httpClient<{ data: EndUserMember[] }>("/members");
      return res.data;
    },
  });

  const createEndUser = useMutation({
    mutationFn: async (data: CreateEndUserMemberInput) => {
      if (ENV.USE_MOCK) {
        await delay(700);
        return { id: `eu-${Date.now()}`, ...data, email: "", isActive: true, joinedAt: new Date().toISOString() } as EndUserMember;
      }
      const res = await httpClient<{ data: EndUserMember }>("/members", { method: "POST", body: data });
      return res.data;
    },
    onSuccess: (newMember) => {
      queryClient.setQueryData<EndUserMember[]>(["end-user-members"], (old = []) => [newMember, ...old]);
      setEndUserModalOpen(false);
    },
  });

  const updateEndUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEndUserMemberInput }) => {
      if (ENV.USE_MOCK) { await delay(500); return { id, ...data } as EndUserMember; }
      const res = await httpClient<{ data: EndUserMember }>(`/members/${id}`, { method: "PATCH", body: data });
      return res.data;
    },
    onSuccess: (updated, { id }) => {
      queryClient.setQueryData<EndUserMember[]>(["end-user-members"], (old = []) =>
        old.map((m) => (m.id === id ? { ...m, ...updated } : m))
      );
      setEndUserModalOpen(false);
      setEditingEndUser(null);
    },
  });

  const toggleEndUserActive = useMutation({
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

  function openEditEndUser(member: EndUserMember) {
    setEditingEndUser(member);
    setEndUserModalOpen(true);
  }

  function openCreateEndUser() {
    setEditingEndUser(null);
    setEndUserModalOpen(true);
  }

  function handleEndUserSubmit(data: CreateEndUserMemberInput | UpdateEndUserMemberInput) {
    if (editingEndUser) {
      updateEndUser.mutate({ id: editingEndUser.id, data: data as UpdateEndUserMemberInput });
    } else {
      createEndUser.mutate(data as CreateEndUserMemberInput);
    }
  }

  function confirmToggleEndUser(member: EndUserMember) {
    const action = member.isActive ? "desactivar" : "activar";
    Alert.alert(
      `¿${member.isActive ? "Desactivar" : "Activar"} miembro?`,
      `Esto ${action}á a ${member.name} ${member.lastname}.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: member.isActive ? "Desactivar" : "Activar",
          style: member.isActive ? "destructive" : "default",
          onPress: () => toggleEndUserActive.mutate({ id: member.id, isActive: !member.isActive }),
        },
      ]
    );
  }

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

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleColorChange(key: "primaryColor" | "secondaryColor" | "backgroundColor", value: string) {
    if (key === "primaryColor") setPrimaryColor(value);
    if (key === "secondaryColor") setSecondaryColor(value);
    if (key === "backgroundColor") setBackgroundColor(value);
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
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 2000);
  }

  // ── Tab renders ────────────────────────────────────────────────────────────
  const renderBranding = () => (
    <View style={styles.tabContent}>
      {Platform.OS === "web" && (
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
                <CustomButton onPress={openFilePicker} variant="secondary">
                  Subir imagen (JPG/PNG)
                </CustomButton>
                {logoPreview && (
                  <TouchableOpacity onPress={() => { setLogoPreview(null); setBranding({ logoUrl: null }); }}>
                    <Text style={[styles.removeText, { color: c.danger }]}>Eliminar logo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <ColorPicker label="Color primario" value={primaryColor} onChange={(v) => handleColorChange("primaryColor", v)} />
          <ColorPicker label="Color secundario" value={secondaryColor} onChange={(v) => handleColorChange("secondaryColor", v)} />
          <ColorPicker label="Color de fondo" value={backgroundColor} onChange={(v) => handleColorChange("backgroundColor", v)} />

          <CustomButton onPress={saveBranding}>
            {brandingSaved ? "¡Cambios guardados!" : "Confirmar cambios"}
          </CustomButton>
        </View>
      </View>
    </View>
  );

  const renderEndUsers = () => (
    <View style={styles.tabContent}>
      {endUsersLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : (
        <View style={styles.memberList}>
          {endUsers.length === 0 && (
            <Text style={{ color: c.textMuted, textAlign: "center", paddingVertical: SPACING.xl }}>
              Sin miembros
            </Text>
          )}
          {endUsers.map((member) => {
            const age = calcAge(member.birthdate);
            return (
              <View
                key={member.id}
                style={[styles.memberRow, { backgroundColor: c.backgroundStrong, borderColor: c.border, opacity: member.isActive ? 1 : 0.6 }]}
              >
                <Avatar name={`${member.name} ${member.lastname}`} size="sm" />
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={[styles.memberName, { color: c.text }]} numberOfLines={1}>
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
                <View style={styles.memberActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: c.border, backgroundColor: c.background }]}
                    onPress={() => openEditEndUser(member)}
                  >
                    <Text style={[styles.actionBtnText, { color: c.text }]}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: member.isActive ? c.danger + "60" : c.border, backgroundColor: member.isActive ? c.danger + "10" : c.background }]}
                    onPress={() => confirmToggleEndUser(member)}
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
  );

  return (
    <>
      <FeatureShell
        title="Configuración"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        saveActions={
          activeTab === "endusers"
            ? [{ label: "Agregar miembro", type: "primary", onClick: openCreateEndUser }]
            : []
        }
      >
        {activeTab === "branding"
          ? renderBranding()
          : activeTab === "endusers"
          ? renderEndUsers()
          : (
            <View style={styles.tabContent}>
              <ChangePasswordSection />
            </View>
          )}
      </FeatureShell>

      <EndUserFormModal
        open={endUserModalOpen}
        onClose={() => { setEndUserModalOpen(false); setEditingEndUser(null); }}
        member={editingEndUser}
        onSubmit={handleEndUserSubmit}
        isLoading={createEndUser.isPending || updateEndUser.isPending}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabContent: { padding: SPACING.md },
  card: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md, gap: SPACING.sm },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  sectionHint: { fontSize: TYPOGRAPHY.fontSize.sm },
  fields: { gap: SPACING.md, marginTop: SPACING.sm },
  fieldLabel: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "500", marginBottom: SPACING.xs },
  logoSection: { gap: SPACING.xs },
  logoRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md, flexWrap: "wrap" },
  logoBox: { width: 72, height: 72, borderRadius: BORDER_RADIUS.md, borderWidth: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoImage: { width: 72, height: 72 },
  logoInitial: { fontSize: 28, fontWeight: "800" },
  logoActions: { gap: SPACING.sm, flex: 1 },
  removeText: { fontSize: TYPOGRAPHY.fontSize.sm },
  center: { paddingVertical: SPACING.xl, alignItems: "center" },
  memberList: { gap: SPACING.sm },
  memberRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1 },
  memberInfo: { flex: 1, gap: 2, minWidth: 0 },
  memberNameRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, flexWrap: "wrap" },
  memberName: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600", flexShrink: 1 },
  memberActions: { flexDirection: "row", gap: SPACING.xs },
  actionBtn: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.sm, borderWidth: 1 },
  actionBtnText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: "500" },
});
