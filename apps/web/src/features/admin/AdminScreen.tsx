import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Table, type Column } from "@/shared/ui";
import { useAuthStore } from "@/shared/store/authStore";
import { useToast } from "@/shared/components/feedback/Toast";
import { ENV } from "@/shared/config/env";
import { httpClient } from "@/shared/api/client";
import { mockAdminOrgDetail, mockAdminOrgs, mockAuditLogs } from "@/shared/api/mocks/admin";
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

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const CLIENT_TYPE_LABELS = {
  gym: "Gimnasio",
  organization: "Organización",
} as const;
const ACTOR_TYPE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: "Administrador del sistema",
  ORG_MEMBER: "Miembro de organización",
};
const TARGET_TYPE_LABELS: Record<string, string> = {
  Organization: "Organización",
  OrgMember: "Miembro de organización",
  ORG_MEMBER: "Miembro de organización",
};

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
    "client.create": "Cliente creado",
    "client.update": "Cliente actualizado",
    "client.deactivate": "Cliente desactivado",
    "client.export": "Cliente exportado",
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

type OrgRow = AdminOrg & Record<string, unknown>;
type LogRow = AuditLog & Record<string, unknown>;

function OrganizationsTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<AdminOrg | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedOrgDetail, setSelectedOrgDetail] = useState<AdminOrgDetail | null>(null);

  const { data: orgs = [], isLoading } = useQuery<AdminOrg[]>({
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

  const createOrg = useMutation({
    mutationFn: async (input: CreateOrgInput) => {
      if (ENV.USE_MOCK) {
        await delay(600);
        return {
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
        } satisfies AdminOrg;
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
      const res = await httpClient<{ data: AdminOrg }>(`/admin/clients/${id}`, { method: "PATCH", body: data });
      return res.data;
    },
    onSuccess: (_result, { id, data }) => {
      queryClient.setQueryData<AdminOrg[]>(["admin-orgs"], (old = []) => old.map((org) => (org.id === id ? { ...org, ...data } : org)));
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
      if (activate) await httpClient(`/admin/clients/${id}`, { method: "PATCH", body: { isActive: true } });
      else await httpClient(`/admin/clients/${id}`, { method: "DELETE" });
    },
    onSuccess: (_result, { id, activate }) => {
      queryClient.setQueryData<AdminOrg[]>(["admin-orgs"], (old = []) => old.map((org) => (org.id === id ? { ...org, isActive: activate } : org)));
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
          user: { sub: input.targetId, username: "mock_impersonated", role: "OWNER", orgId: "org-1", impersonatedBy: "mock-admin-1" },
        } as ImpersonateResult;
      }
      const res = await httpClient<{ data: ImpersonateResult }>("/admin/impersonate", { method: "POST", body: input });
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

  async function handleExport(org: AdminOrg) {
    try {
      const exportData = ENV.USE_MOCK
        ? { ...mockAdminOrgDetail, id: org.id, name: org.name, slug: org.slug }
        : (await httpClient<{ data: unknown }>(`/admin/clients/${org.id}/export`)).data;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${org.slug}-export.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Exportación lista");
    } catch {
      toast.error("Error al exportar");
    }
  }

  async function handleOpenMembers(org: AdminOrg) {
    setMembersOpen(true);
    if (ENV.USE_MOCK) {
      await delay(400);
      setSelectedOrgDetail({ ...mockAdminOrgDetail, id: org.id, name: org.name, slug: org.slug });
      return;
    }
    const res = await httpClient<{ data: AdminOrgDetail }>(`/admin/clients/${org.id}`);
    setSelectedOrgDetail(res.data);
  }

  const columns: Column<OrgRow>[] = [
    { key: "name", header: "Cliente" },
    { key: "tipo", header: "Tipo", render: (row) => CLIENT_TYPE_LABELS[row.tipo] ?? row.tipo },
    { key: "users", header: "Usuarios", render: (row) => row._count.clientMembers },
    { key: "members", header: "Miembros", render: (row) => row._count.members },
    { key: "state", header: "Estado", render: (row) => <Badge color={row.isActive ? "green" : "red"}>{row.isActive ? "Activo" : "Inactivo"}</Badge> },
    {
      key: "actions",
      header: "Acciones",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleOpenMembers(row)}>Miembros</Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditingOrg(row); setFormOpen(true); }}>Editar</Button>
          <Button size="sm" variant="ghost" onClick={() => handleExport(row)}>Exportar</Button>
          <Button size="sm" variant={row.isActive ? "danger" : "ghost"} onClick={() => toggleOrgActive.mutate({ id: row.id, activate: !row.isActive })} disabled={toggleOrgActive.isPending}>
            {row.isActive ? "Desactivar" : "Activar"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-gray-700">{orgs.length} {orgs.length === 1 ? "cliente" : "clientes"}</p>
        <Button size="sm" onClick={() => { setEditingOrg(null); setFormOpen(true); }}>Nuevo cliente</Button>
      </div>
      <Table columns={columns} rows={orgs as OrgRow[]} keyExtractor={(row) => row.id} loading={isLoading} emptyText="No hay clientes" />
      <ClientFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingOrg(null); }}
        org={editingOrg}
        isLoading={createOrg.isPending || updateOrg.isPending}
        onSubmit={(data) => {
          if (editingOrg) updateOrg.mutate({ id: editingOrg.id, data: data as UpdateOrgInput });
          else createOrg.mutate(data as CreateOrgInput);
        }}
      />
      <ClientMembersModal
        open={membersOpen}
        onClose={() => { setMembersOpen(false); setSelectedOrgDetail(null); }}
        orgDetail={selectedOrgDetail}
        isLoading={!selectedOrgDetail && membersOpen}
        isImpersonating={impersonateMember.isPending}
        onImpersonate={(member: AdminOrgMember) => impersonateMember.mutate({ targetId: member.id, targetType: "ORG_MEMBER" })}
      />
    </>
  );
}

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

  const columns: Column<LogRow>[] = [
    { key: "createdAt", header: "Fecha", render: (row) => formatDate(row.createdAt) },
    { key: "actorType", header: "Tipo actor", render: (row) => ACTOR_TYPE_LABELS[row.actorType] ?? row.actorType },
    { key: "action", header: "Acción", render: (row) => actionLabel(row.action) },
    { key: "targetType", header: "Objetivo", render: (row) => row.targetType ? TARGET_TYPE_LABELS[row.targetType] ?? row.targetType : "—" },
    { key: "orgId", header: "Org ID", render: (row) => row.orgId ?? "Sistema" },
  ];

  return <Table columns={columns} rows={logs as LogRow[]} keyExtractor={(row) => row.id} loading={isLoading} emptyText="Sin registros de actividad" />;
}

const ADMIN_TABS = [
  { key: "orgs", label: "Organizaciones" },
  { key: "logs", label: "Auditoría" },
] as const;

type AdminTab = (typeof ADMIN_TABS)[number]["key"];

export function AdminScreen({ activeTab = "orgs" }: { activeTab?: AdminTab }) {
  return (
    <div className="page feature-page">
      <header className="feature-header">
        <h1 className="page-title">Panel de administración · {ADMIN_TABS.find((tab) => tab.key === activeTab)?.label}</h1>
      </header>
      <section className="feature-content">
        {activeTab === "orgs" ? <OrganizationsTab /> : <AuditLogsTab />}
      </section>
    </div>
  );
}
