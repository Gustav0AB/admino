import { useEffect, useState } from "react";
import { Button, DatePicker, Modal, TextField } from "@generic/components";
import { useClientStore } from "@/shared/store/clientStore";
import type {
  EndUserMember,
  CreateEndUserMemberInput,
  UpdateEndUserMemberInput,
} from "@/shared/types/member";

type Props = {
  open: boolean;
  onClose: () => void;
  member?: EndUserMember | null;
  onSubmit: (data: CreateEndUserMemberInput | UpdateEndUserMemberInput) => void;
  isLoading?: boolean;
};

function calcAge(iso: string): number | null {
  const dob = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function EndUserFormModal({ open, onClose, member, onSubmit, isLoading }: Props) {
  const slug = useClientStore((s) => s.branding.slug);
  const isEditing = !!member;
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [withAccount, setWithAccount] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setName(member?.name ?? "");
    setLastname(member?.lastname ?? "");
    setBirthdate(member?.birthdate?.slice(0, 10) ?? "");
    setWithAccount(!!member?.username);
    setUsername(member?.username ?? "");
    setPassword("");
    setErrors({});
  }, [open, member]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "El nombre es obligatorio";
    if (!lastname.trim()) errs.lastname = "El apellido es obligatorio";
    if (!birthdate) errs.birthdate = "La fecha de nacimiento es obligatoria";
    if (!isEditing && withAccount) {
      if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim()) || username.trim().length < 3)
        errs.username = "Mínimo 3 caracteres, solo letras, números, puntos, guiones y _";
      if (password.length < 8) errs.password = "Mínimo 8 caracteres";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (isEditing) {
      onSubmit({ name: name.trim(), lastname: lastname.trim(), birthdate } as UpdateEndUserMemberInput);
      return;
    }
    onSubmit({
      name: name.trim(),
      lastname: lastname.trim(),
      birthdate,
      ...(withAccount ? { username: username.trim(), password } : {}),
    });
  }

  const age = birthdate ? calcAge(birthdate) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar miembro" : "Nuevo miembro"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={!!isLoading}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={!!isLoading} disabled={!!isLoading}>
            {isEditing ? "Guardar" : "Agregar"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField label="Nombre" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre" error={errors.name} />
        <TextField label="Apellido" value={lastname} onChange={(event) => setLastname(event.target.value)} placeholder="Apellido" error={errors.lastname} />
        <div>
          <DatePicker label="Fecha de nacimiento" value={birthdate} onChange={setBirthdate} placeholder="Seleccionar fecha" locale="es-MX" />
          {errors.birthdate && <p className="mt-1 text-xs text-danger">{errors.birthdate}</p>}
          {age !== null && <p className="mt-1 text-xs text-gray-500">Edad: {age} años</p>}
        </div>

        {!isEditing && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={withAccount} onChange={(event) => setWithAccount(event.target.checked)} />
            Crear cuenta de acceso
          </label>
        )}

        {!isEditing && withAccount && (
          <div className="flex flex-col gap-4">
            <div>
              <TextField label="Nombre de usuario" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="ej. juan_perez" error={errors.username} />
              {slug && username.trim() && (
                <p className="mt-1 text-xs text-gray-500">Iniciará sesión como: {slug}-{username.trim()}</p>
              )}
            </div>
            <TextField label="Contraseña" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" error={errors.password} />
          </div>
        )}
      </div>
    </Modal>
  );
}
