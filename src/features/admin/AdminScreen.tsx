import { useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/shared/hooks/useColors";
import { useAuthStore } from "@/shared/store/authStore";
import { useToast } from "@/shared/components/feedback/Toast";
import { MainLayout } from "@/shared/components/MainLayout";
import { RoleGuard } from "@/shared/components/RoleGuard";
import { DataTable, type Column } from "@/shared/components/data-display/DataTable";
import { StatusBadge } from "@/shared/components/data-display/StatusBadge";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { CustomTabs } from "@/shared/components/inputs/CustomTabs";
import { ENV } from "@/shared/config/env";
import { httpClient } from "@/shared/api/client";
import {
  mockAdminOrgs,
  mockAdminOrgDetail,
  mockAuditLogs,
} from "@/shared/api/mocks/admin";
import { ClientFormModal } from "./ClientFormModal";
import { ClientMembersModal } from "./ClientMembersModal";
import type {
  AdminOrg,
  AdminOrgDetail,
  AdminOrgMember,
  AuditLog,
  CreateOrgInput,
  UpdateOrgInput,
  ImpersonateInput,
  ImpersonateResult,
} from "@/shared/types/admin";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { ChangePasswordSection } from "@/shared/components/inputs/ChangePasswordSection";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    "org.create": "Org creada",
    "org.update": "Org actualizada",
    "org.deactivate": "Org desactivada",
    "org.export": "Org exportada",
    "member.create": "Miembro creado",
    "member.update": "Miembro actualizado",
    "member.deactivate": "Miembro desactivado",
    "user.impersonate": "Impersonación",
    "plan.create": "Plan creado",
    "plan.assign": "Plan asignado",
    "notification.send": "Notificación enviada",
  };
  return map[action] ?? action;
}

// ─── OrganizationsTab ─────────────────────────────────────────────────────────

type OrgRow = Omit<AdminOrg, "_count"> & {
  memberCount: number;
  clientCount: number;
  _original: AdminOrg;
} & Record<string, unknown>;

function toOrgRow(org: AdminOrg): OrgRow {
  const { _count, ...rest } = org;
  return { ...rest, memberCount: _count?.clientMembers ?? 0, clientCount: _count?.members ?? 0, _original: org };
}

const ORG_COLUMNS: Column<OrgRow>[] = [
  { key: "name", header: "Cliente", flex: 2, sortable: true },
  { key: "tipo", header: "Tipo", flex: 1, sortable: true },
  { key: "memberCount", header: "Usuarios", width: 90, align: "center", sortable: true },
  { key: "clientCount", header: "Miembros", width: 90, align: "center", sortable: true },
  {
    key: "isActive",
    header: "Estado",
    width: 90,
    align: "center",
    render: (v) => (
      <StatusBadge
        status={v ? "active" : "cancelled"}
        customLabel={v ? "Activo" : "Inactivo"}
        size="sm"
      />
    ),
  },
];

function OrganizationsTab() {
  const c = useColors();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<AdminOrg | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedOrgDetail, setSelectedOrgDetail] = useState<AdminOrgDetail | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: rawOrgs = [], isLoading } = useQuery<AdminOrg[]>({
    queryKey: ["admin-orgs"],
    queryFn: async () => {
      if (ENV.USE_MOCK) {
        await delay(800);
        return mockAdminOrgs;
      }
      const res = await httpClient<{ data: AdminOrg[] }>("/admin/clients");
      return res.data;
    },
  });

  const orgs = rawOrgs.map(toOrgRow);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createOrg = useMutation({
    mutationFn: async (input: CreateOrgInput) => {
      if (ENV.USE_MOCK) {
        await delay(600);
        const newOrg: AdminOrg = {
          id: `org-${Date.now()}`,
          name: input.name,
          slug: input.accountName,
          tipo: input.tipo,
          branding: { primaryColor: "#2563EB", secondaryColor: "#1E40AF", logoUrl: null },
          isActive: true,
          clientPermissions: input.clientPermissions,
          memberPermissions: input.memberPermissions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: { clientMembers: 1, members: 0 },
        };
        return newOrg;
      }
      const res = await httpClient<{ data: AdminOrg }>("/admin/clients", {
        method: "POST",
        body: {
          name: input.name,
          slug: input.accountName,
          tipo: input.tipo,
          ownerName: input.ownerName,
          ownerPassword: input.password,
          clientPermissions: input.clientPermissions,
          memberPermissions: input.memberPermissions,
        },
      });
      return res.data;
    },
    onSuccess: (newOrg) => {
      queryClient.setQueryData<AdminOrg[]>(["admin-orgs"], (old = []) => [newOrg, ...old]);
      setFormOpen(false);
      toast.success("Cliente creado correctamente");
    },
    onError: () => toast.error("Error al crear la organización"),
  });

  const updateOrg = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOrgInput }) => {
      if (ENV.USE_MOCK) {
        await delay(500);
        return null;
      }
      const res = await httpClient<{ data: AdminOrg }>(`/admin/clients/${id}`, {
        method: "PATCH",
        body: data,
      });
      return res.data;
    },
    onSuccess: (_result, { id, data }) => {
      queryClient.setQueryData<AdminOrg[]>(["admin-orgs"], (old = []) =>
        old.map((o) => (o.id === id ? { ...o, ...data } : o))
      );
      setFormOpen(false);
      setEditingOrg(null);
      toast.success("Cliente actualizado");
    },
    onError: () => toast.error("Error al actualizar la organización"),
  });

  const toggleOrgActive = useMutation({
    mutationFn: async ({ id, activate }: { id: string; activate: boolean }) => {
      if (ENV.USE_MOCK) {
        await delay(500);
        return;
      }
      if (activate) {
        await httpClient(`/admin/clients/${id}`, {
          method: "PATCH",
          body: { isActive: true },
        });
      } else {
        await httpClient(`/admin/clients/${id}`, { method: "DELETE" });
      }
    },
    onSuccess: (_result, { id, activate }) => {
      queryClient.setQueryData<AdminOrg[]>(["admin-orgs"], (old = []) =>
        old.map((o) => (o.id === id ? { ...o, isActive: activate } : o))
      );
      toast.success(activate ? "Cliente activado" : "Cliente desactivado");
    },
    onError: () => toast.error("Error al cambiar el estado"),
  });

  const impersonateMember = useMutation({
    mutationFn: async (input: ImpersonateInput) => {
      if (ENV.USE_MOCK) {
        await delay(700);
        return {
          token: "mock-impersonation-token",
          user: {
            sub: input.targetId,
            username: "mock_impersonated",
            role: "OWNER",
            orgId: "org-1",
            impersonatedBy: "mock-admin-1",
          },
        } as ImpersonateResult;
      }
      const res = await httpClient<{ data: ImpersonateResult }>("/admin/impersonate", {
        method: "POST",
        body: input,
      });
      return res.data;
    },
    onSuccess: (result) => {
      setMembersOpen(false);
      useAuthStore.setState({
        token: result.token,
        user: {
          id: result.user.sub,
          username: result.user.username,
          name: "Usuario impersonado",
          role: result.user.role as import("@/shared/types/auth").UserRole,
          orgId: result.user.orgId,
        },
        isAuthenticated: true,
      });
      toast.info(`Sesión iniciada como ${result.user.username}. Cierra sesión para volver.`);
    },
    onError: () => toast.error("Error al impersonar el usuario"),
  });

  // ── Export ─────────────────────────────────────────────────────────────────

  async function handleExport(org: AdminOrg) {
    try {
      let exportData: unknown;
      if (ENV.USE_MOCK) {
        await delay(400);
        exportData = { ...mockAdminOrgDetail, id: org.id, name: org.name, slug: org.slug };
      } else {
        const res = await httpClient<{ data: unknown }>(
          `/admin/clients/${org.id}/export`
        );
        exportData = res.data;
      }

      const json = JSON.stringify(exportData, null, 2);

      if (Platform.OS === "web") {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${org.slug}-export.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const Sharing = await import("expo-sharing");
        const FileSystem = await import("expo-file-system");
        const dir = (FileSystem as Record<string, unknown>).documentDirectory as string ?? "";
        const path = `${dir}${org.slug}-export.json`;
        await (FileSystem as { writeAsStringAsync: (p: string, c: string) => Promise<void> }).writeAsStringAsync(path, json);
        await Sharing.default.shareAsync(path, { mimeType: "application/json" });
      }

      toast.success("Exportación lista");
    } catch {
      toast.error("Error al exportar");
    }
  }

  // ── Members modal ──────────────────────────────────────────────────────────

  async function handleOpenMembers(org: AdminOrg) {
    setMembersOpen(true);
    if (ENV.USE_MOCK) {
      await delay(400);
      setSelectedOrgDetail({ ...mockAdminOrgDetail, id: org.id, name: org.name, slug: org.slug });
      return;
    }
    const res = await httpClient<{ data: AdminOrgDetail }>(
      `/admin/clients/${org.id}`
    );
    setSelectedOrgDetail(res.data);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <View style={styles.topBar}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>
          {orgs.length} {orgs.length === 1 ? "cliente" : "clientes"}
        </Text>
        <CustomButton
          size="sm"
          onPress={() => {
            setEditingOrg(null);
            setFormOpen(true);
          }}
        >
          + Nuevo cliente
        </CustomButton>
      </View>

      <DataTable<OrgRow>
        data={orgs as OrgRow[]}
        columns={ORG_COLUMNS}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        searchable
        emptyText="No hay clientes"
        renderActions={(row) => (
          <View style={styles.actions}>
            <CustomButton
              size="sm"
              variant="outline"
              onPress={() => handleOpenMembers(row._original)}
            >
              Miembros
            </CustomButton>
            <CustomButton
              size="sm"
              variant="outline"
              onPress={() => {
                setEditingOrg(row._original);
                setFormOpen(true);
              }}
            >
              Editar
            </CustomButton>
            <CustomButton
              size="sm"
              variant="ghost"
              onPress={() => handleExport(row._original)}
            >
              Exportar
            </CustomButton>
            <CustomButton
              size="sm"
              variant="ghost"
              onPress={() =>
                toggleOrgActive.mutate({ id: row.id as string, activate: !row.isActive })
              }
              disabled={toggleOrgActive.isPending}
            >
              {row.isActive ? "Desactivar" : "Activar"}
            </CustomButton>
          </View>
        )}
        actionsLabel="Acciones"
        actionsWidth={280}
      />

      <ClientFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingOrg(null);
        }}
        org={editingOrg}
        isLoading={createOrg.isPending || updateOrg.isPending}
        onSubmit={(data) => {
          if (editingOrg) {
            updateOrg.mutate({ id: editingOrg.id, data: data as UpdateOrgInput });
          } else {
            createOrg.mutate(data as CreateOrgInput);
          }
        }}
      />

      <ClientMembersModal
        open={membersOpen}
        onClose={() => {
          setMembersOpen(false);
          setSelectedOrgDetail(null);
        }}
        orgDetail={selectedOrgDetail}
        isLoading={!selectedOrgDetail && membersOpen}
        isImpersonating={impersonateMember.isPending}
        onImpersonate={(member: AdminOrgMember) => {
          impersonateMember.mutate({
            targetId: member.id,
            targetType: "ORG_MEMBER",
          });
        }}
      />
    </>
  );
}

// ─── AuditLogsTab ─────────────────────────────────────────────────────────────

type LogRow = AuditLog & Record<string, unknown>;

const LOG_COLUMNS: Column<LogRow>[] = [
  {
    key: "createdAt",
    header: "Fecha",
    width: 150,
    render: (v) => (
      <Text style={{ fontSize: TYPOGRAPHY.fontSize.xs }}>{formatDate(v as string)}</Text>
    ),
  },
  {
    key: "actorType",
    header: "Tipo actor",
    width: 110,
    render: (v) => {
      const labels: Record<string, string> = {
        SYSTEM_ADMIN: "Super Admin",
        ORG_MEMBER: "Miembro",
        CLIENT: "Cliente",
      };
      return (
        <Text style={{ fontSize: TYPOGRAPHY.fontSize.xs }}>{labels[v as string] ?? (v as string)}</Text>
      );
    },
  },
  {
    key: "action",
    header: "Acción",
    flex: 1.5,
    render: (v) => (
      <Text style={{ fontSize: TYPOGRAPHY.fontSize.sm }}>{actionLabel(v as string)}</Text>
    ),
  },
  {
    key: "targetType",
    header: "Objetivo",
    flex: 1,
    render: (v) => (
      <Text style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: "#6B7280" }}>{(v as string) ?? "—"}</Text>
    ),
  },
  {
    key: "orgId",
    header: "Org ID",
    flex: 1,
    render: (v) => (
      <Text style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: "#9CA3AF" }} numberOfLines={1}>
        {(v as string) ?? "Sistema"}
      </Text>
    ),
  },
];

function AuditLogsTab() {
  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      if (ENV.USE_MOCK) {
        await delay(800);
        return mockAuditLogs;
      }
      const res = await httpClient<{ data: AuditLog[] }>("/admin/audit-logs");
      return res.data;
    },
  });

  return (
    <DataTable<LogRow>
      data={logs as LogRow[]}
      columns={LOG_COLUMNS}
      keyExtractor={(r) => r.id}
      isLoading={isLoading}
      searchable
      emptyText="Sin registros de actividad"
      rowDivider="borders"
    />
  );
}

// ─── AdminScreen ──────────────────────────────────────────────────────────────

const TABS = [
  { key: "orgs", label: "Organizaciones" },
  { key: "logs", label: "Audit Logs" },
  { key: "security", label: "Security" },
];

export function AdminScreen() {
  const c = useColors();
  const [activeTab, setActiveTab] = useState("orgs");

  return (
    <RoleGuard allowedRoles={["SYSTEM_ADMIN"]}>
      <MainLayout scrollable={false}>
        <View style={[styles.container, { backgroundColor: c.background }]}>
          <View style={styles.header}>
            <Text style={[styles.pageTitle, { color: c.text }]}>Panel de administración</Text>
            <Text style={[styles.pageSubtitle, { color: c.textMuted }]}>
              Gestión global del sistema
            </Text>
          </View>

          <CustomTabs
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="underline"
          />

          <View style={styles.tabContent}>
            {activeTab === "orgs" ? <OrganizationsTab /> : activeTab === "logs" ? <AuditLogsTab /> : <ChangePasswordSection />}
          </View>
        </View>
      </MainLayout>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  header: {
    gap: SPACING.xs,
  },
  pageTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  pageSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  tabContent: {
    flex: 1,
    gap: SPACING.md,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.xs,
    flexWrap: "wrap",
  },
});
