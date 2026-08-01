import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card } from "@/shared/ui";
import { ENV } from "@/shared/config/env";
import { httpClient } from "@/shared/api/client";
import { mockOrgMembers } from "@/shared/api/mocks/member";
import type { OrgMember, CreateMemberInput, UpdateMemberInput } from "@/shared/types/member";
import { MemberFormModal } from "@/features/client-settings/MemberFormModal";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  MEMBER: "Miembro",
};

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function StaffContent({ onReady }: { onReady: (openCreate: () => void) => void }) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<OrgMember | null>(null);

  useEffect(() => {
    onReady(() => { setEditingMember(null); setModalOpen(true); });
  }, [onReady]);

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
    onSuccess: (member) => {
      queryClient.setQueryData<OrgMember[]>(["org-members"], (old = []) => [member, ...old]);
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
      queryClient.setQueryData<OrgMember[]>(["org-members"], (old = []) => old.map((member) => (member.id === id ? { ...member, ...data } : member)));
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
      queryClient.setQueryData<OrgMember[]>(["org-members"], (old = []) => old.map((member) => (member.id === id ? { ...member, isActive } : member)));
    },
  });

  function confirmToggle(member: OrgMember) {
    const ok = window.confirm(`¿${member.isActive ? "Desactivar" : "Activar"} usuario ${member.name}?`);
    if (ok) toggleActive.mutate({ id: member.id, isActive: !member.isActive });
  }

  function handleSubmit(data: CreateMemberInput | UpdateMemberInput) {
    if (editingMember) updateMember.mutate({ id: editingMember.id, data: data as UpdateMemberInput });
    else createMember.mutate(data as CreateMemberInput);
  }

  return (
    <>
      <div className="p-4">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-gray-500">Cargando…</p>
        ) : members.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">Sin usuarios</p>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((member) => (
              <Card key={member.id} padding="sm" className={member.isActive ? "" : "opacity-60"}>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {initials(member.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
                      <Badge color={member.isActive ? "green" : "red"}>{member.isActive ? "Activo" : "Inactivo"}</Badge>
                    </div>
                    <p className="truncate text-xs text-gray-500">{member.username}</p>
                    <p className="text-xs font-medium text-primary">{ROLE_LABEL[member.role] ?? member.role}</p>
                  </div>
                  {member.role !== "OWNER" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingMember(member); setModalOpen(true); }}>Editar</Button>
                      <Button size="sm" variant={member.isActive ? "danger" : "ghost"} onClick={() => confirmToggle(member)}>
                        {member.isActive ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

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
