import { useEffect, useState } from "react";
import { Button, Dropdown, Modal, TextField } from "@generic/components";
import { SECTION_PERMISSIONS } from "@/shared/types/member";
import type { AdminOrg, ClientType, CreateOrgInput, UpdateOrgInput } from "@/shared/types/admin";

const TIPO_OPTIONS = [
  { label: "Gimnasio", value: "gym" },
  { label: "Academia", value: "academy" },
  { label: "Escuela", value: "school" },
  { label: "Empresa", value: "company" },
  { label: "Organización", value: "organization" },
  { label: "Otro", value: "other" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  org?: AdminOrg | null;
  onSubmit: (data: CreateOrgInput | UpdateOrgInput) => void;
  isLoading?: boolean;
};

const DEFAULT_CLIENT_PERMISSIONS = ["finanzas", "athlete_dashboard"];
const DEFAULT_MEMBER_PERMISSIONS = ["finanzas", "athlete_tracker"];

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
}

export function ClientFormModal({ open, onClose, org, onSubmit, isLoading }: Props) {
  const isEditing = !!org;
  const [name, setName] = useState("");
  const [tipo, setTipo] = useState<ClientType>("gym");
  const [accountName, setAccountName] = useState("");
  const [accountNameTouched, setAccountNameTouched] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [password, setPassword] = useState("");
  const [clientPermissions, setClientPermissions] = useState<string[]>([]);
  const [memberPermissions, setMemberPermissions] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setName(org?.name ?? "");
    setTipo((org?.tipo ?? "gym") as ClientType);
    setAccountName(org?.slug ?? "");
    setAccountNameTouched(false);
    setOwnerName("");
    setPassword("");
    setClientPermissions(org?.clientPermissions ?? DEFAULT_CLIENT_PERMISSIONS);
    setMemberPermissions(org?.memberPermissions ?? DEFAULT_MEMBER_PERMISSIONS);
    setErrors({});
  }, [open, org]);

  useEffect(() => {
    if (!accountNameTouched && !isEditing) setAccountName(slugify(name));
  }, [name, accountNameTouched, isEditing]);

  function togglePerm(key: string, list: string[], setList: (value: string[]) => void) {
    setList(list.includes(key) ? list.filter((permission) => permission !== key) : [...list, key]);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "El nombre es obligatorio";
    if (!accountName.trim()) errs.accountName = "El nombre de cuenta es obligatorio";
    else if (!/^[a-z0-9-]+$/.test(accountName)) errs.accountName = "Solo letras minúsculas, números y guiones";
    if (!isEditing && !ownerName.trim()) errs.ownerName = "El nombre del propietario es obligatorio";
    if (!isEditing && password.length < 8) errs.password = "Mínimo 8 caracteres";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (isEditing) {
      onSubmit({ name: name.trim(), clientPermissions, memberPermissions } as UpdateOrgInput);
      return;
    }
    onSubmit({
      name: name.trim(),
      tipo,
      accountName: accountName.trim(),
      ownerName: ownerName.trim(),
      password,
      clientPermissions,
      memberPermissions,
    } as CreateOrgInput);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar cliente" : "Nuevo cliente"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={!!isLoading}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={!!isLoading} disabled={!!isLoading}>
            {isEditing ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </>
      }
    >
      <div className="flex max-h-[520px] flex-col gap-4 overflow-y-auto pr-1">
        <TextField label="Nombre" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. FitLife Studio" error={errors.name} />
        {!isEditing && (
          <Dropdown label="Tipo" value={tipo} options={TIPO_OPTIONS} onChange={(value) => setTipo(value as ClientType)} />
        )}
        <TextField
          label="Nombre de cuenta"
          value={accountName}
          onChange={(event) => {
            setAccountNameTouched(true);
            setAccountName(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
          }}
          placeholder="fitlife-studio"
          helperText="Identificador único del cliente (solo minúsculas, números y guiones)"
          error={errors.accountName}
        />
        {!isEditing && (
          <TextField label="Nombre del propietario" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} placeholder="Ej. Juan Pérez" error={errors.ownerName} />
        )}
        {!isEditing && (
          <TextField label="Contraseña" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" error={errors.password} />
        )}
        <PermissionSection title="Servicios del cliente" hint="Qué secciones puede ver y usar este cliente." selected={clientPermissions} onToggle={(key) => togglePerm(key, clientPermissions, setClientPermissions)} />
        <PermissionSection title="Servicios para miembros" hint="Qué secciones pueden ver los miembros de este cliente." selected={memberPermissions} onToggle={(key) => togglePerm(key, memberPermissions, setMemberPermissions)} />
      </div>
    </Modal>
  );
}

function PermissionSection({ title, hint, selected, onToggle }: { title: string; hint: string; selected: string[]; onToggle: (key: string) => void }) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
      <div className="flex flex-col gap-2">
        {SECTION_PERMISSIONS.map((permission) => (
          <label key={permission.key} className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={selected.includes(permission.key)} onChange={() => onToggle(permission.key)} />
            {permission.label}
          </label>
        ))}
      </div>
    </section>
  );
}
