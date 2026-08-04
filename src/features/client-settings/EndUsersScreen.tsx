import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card } from "@/shared/ui";
import { ENV } from "@/shared/config/env";
import { httpClient } from "@/shared/api/client";
import { EndUserFormModal } from "./EndUserFormModal";
import type {
  EndUserMember,
  CreateEndUserMemberInput,
  UpdateEndUserMemberInput,
} from "@/shared/types/member";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function calcAge(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const dob = new Date(`${birthdate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : null;
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function AtletasContent({ onReady }: { onReady: (openCreate: () => void) => void }) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<EndUserMember | null>(null);

  useEffect(() => {
    onReady(() => { setEditingMember(null); setModalOpen(true); });
  }, [onReady]);

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
    onSuccess: (member) => {
      queryClient.setQueryData<EndUserMember[]>(["end-user-members"], (old = []) => [member, ...old]);
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
        old.map((member) => (member.id === id ? { ...member, ...updated } : member))
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
        old.map((member) => (member.id === id ? { ...member, isActive } : member))
      );
    },
  });

  function confirmToggle(member: EndUserMember) {
    const ok = window.confirm(`¿${member.isActive ? "Desactivar" : "Activar"} miembro ${member.name} ${member.lastname}?`);
    if (ok) toggleActive.mutate({ id: member.id, isActive: !member.isActive });
  }

  function handleSubmit(data: CreateEndUserMemberInput | UpdateEndUserMemberInput) {
    if (editingMember) updateMember.mutate({ id: editingMember.id, data: data as UpdateEndUserMemberInput });
    else createMember.mutate(data as CreateEndUserMemberInput);
  }

  return (
    <>
      <div className="p-4">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-gray-500">Cargando…</p>
        ) : members.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">Sin miembros</p>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((member) => {
              const age = calcAge(member.birthdate);
              const fullName = `${member.name} ${member.lastname}`;
              return (
                <Card key={member.id} padding="sm" className={member.isActive ? "" : "opacity-60"}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {initials(fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">{fullName}</p>
                        <Badge color={member.isActive ? "green" : "red"}>{member.isActive ? "Activo" : "Inactivo"}</Badge>
                      </div>
                      {age !== null && <p className="text-xs text-gray-500">{age} años</p>}
                      {member.username && <p className="text-xs text-primary">@{member.username}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingMember(member); setModalOpen(true); }}>Editar</Button>
                      <Button size="sm" variant={member.isActive ? "danger" : "ghost"} onClick={() => confirmToggle(member)}>
                        {member.isActive ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

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
