import { Badge, Button, Card, Modal } from "@generic/components";
import type { AdminOrgDetail, AdminOrgMember } from "@/shared/types/admin";

type Props = {
  open: boolean;
  onClose: () => void;
  orgDetail: AdminOrgDetail | null;
  isLoading?: boolean;
  onImpersonate: (member: AdminOrgMember) => void;
  isImpersonating?: boolean;
};

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  MEMBER: "Miembro",
};

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function ClientMembersModal({ open, onClose, orgDetail, isLoading, onImpersonate, isImpersonating }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={orgDetail ? `Miembros — ${orgDetail.name}` : "Miembros"}
      footer={<Button variant="ghost" onClick={onClose}>Cerrar</Button>}
    >
      {isLoading ? (
        <p className="py-10 text-center text-sm text-gray-500">Cargando…</p>
      ) : (
        <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
          {orgDetail?.members.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">Sin miembros</p>
          )}
          {orgDetail?.members.map((member) => (
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
                <Button size="sm" variant="ghost" onClick={() => onImpersonate(member)} disabled={isImpersonating || !member.isActive}>
                  {isImpersonating ? "Entrando…" : "Impersonar"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Modal>
  );
}
