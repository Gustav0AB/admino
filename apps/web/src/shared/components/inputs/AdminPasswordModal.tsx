import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, Modal, TextField } from "@/shared/ui";
import { ENV } from "@/shared/config/env";
import { httpClient } from "@/shared/api/client";
import { useToast } from "@/shared/components/feedback/Toast";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  userType: "SYSTEM_ADMIN" | "CLIENT_MEMBER" | "MEMBER";
  userName: string;
};

export function AdminPasswordModal({ open, onClose, userId, userType, userName }: Props) {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: () => ENV.USE_MOCK
      ? Promise.resolve()
      : httpClient(`/auth/users/${userType}/${userId}/password`, { method: "PATCH", body: { newPassword: password } }),
    onSuccess: () => { toast.success("Contraseña actualizada"); onClose(); },
    onError: (cause: Error) => toast.error(cause.message || "No se pudo actualizar la contraseña"),
  });

  useEffect(() => { if (open) { setPassword(""); setConfirm(""); setError(""); } }, [open, userId]);

  function submit() {
    if (password.length < 8) return setError("Mínimo 8 caracteres");
    if (password !== confirm) return setError("Las contraseñas no coinciden");
    setError("");
    mutation.mutate();
  }

  return <Modal open={open} onClose={onClose} title={`Cambiar contraseña · ${userName}`} footer={
    <><Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button><Button onClick={submit} loading={mutation.isPending}>Actualizar</Button></>
  }>
    <div className="flex flex-col gap-3">
      <TextField label="Nueva contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
      <TextField label="Confirmar contraseña" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={error} />
    </div>
  </Modal>;
}
