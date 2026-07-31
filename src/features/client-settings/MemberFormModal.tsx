import { useEffect, useState } from "react";
import { Button, Modal, TextField } from "@generic/components";
import { useClientStore } from "@/shared/store/clientStore";
import type { OrgMember, CreateMemberInput, UpdateMemberInput } from "@/shared/types/member";

type Props = {
  open: boolean;
  onClose: () => void;
  member?: OrgMember | null;
  onSubmit: (data: CreateMemberInput | UpdateMemberInput) => void;
  isLoading?: boolean;
};

export function MemberFormModal({ open, onClose, member, onSubmit, isLoading }: Props) {
  const slug = useClientStore((s) => s.branding.slug);
  const isEditing = !!member;
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setName(member?.name ?? "");
    setUsername(member?.username ?? "");
    setEmail(member?.email ?? "");
    setPassword("");
    setErrors({});
  }, [open, member]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "El nombre es obligatorio";
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = "Email inválido";
    if (!isEditing) {
      if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) errs.username = "Solo letras, números, puntos, guiones y _";
      if (password.length < 8) errs.password = "Mínimo 8 caracteres";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (isEditing) {
      onSubmit({ name: name.trim(), email: email.trim() || null } as UpdateMemberInput);
      return;
    }
    onSubmit({
      name: name.trim(),
      username: username.trim(),
      email: email.trim() || undefined,
      password,
      role: "MEMBER",
      permissions: [],
    } as CreateMemberInput);
  }

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
        <TextField label="Nombre" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre completo" error={errors.name} />
        {!isEditing && (
          <div>
            <TextField label="Nombre de usuario" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="ej. john_doe" error={errors.username} />
            {slug && username.trim() && (
              <p className="mt-1 text-xs text-gray-500">Iniciará sesión como: {slug}-{username.trim()}</p>
            )}
          </div>
        )}
        <TextField label="Email (opcional, para restablecer contraseña)" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@ejemplo.com" error={errors.email} />
        {!isEditing && (
          <TextField label="Contraseña" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" error={errors.password} />
        )}
      </div>
    </Modal>
  );
}
