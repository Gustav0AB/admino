import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, Card, TextField } from "@/shared/ui";
import { useToast } from "@/shared/components/feedback/Toast";
import { ENV } from "@/shared/config/env";
import { httpClient } from "@/shared/api/client";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function ChangePasswordSection() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!current) errs.current = "Requerido";
    if (next.length < 8) errs.next = "Mínimo 8 caracteres";
    if (next !== confirm) errs.confirm = "Las contraseñas no coinciden";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (ENV.USE_MOCK) {
        await delay(600);
        return;
      }
      await httpClient("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
    },
    onSuccess: () => {
      toast.success("Contraseña actualizada");
      setCurrent("");
      setNext("");
      setConfirm("");
      setErrors({});
    },
    onError: (e: Error) => {
      toast.error(e.message ?? "No se pudo actualizar la contraseña");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  }

  return (
    <Card className="max-w-xl">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <h2 className="text-base font-semibold text-gray-900">Cambiar contraseña</h2>
        <TextField
          label="Contraseña actual"
          type="password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          placeholder="••••••••"
          error={errors.current}
        />
        <TextField
          label="Nueva contraseña"
          type="password"
          value={next}
          onChange={(event) => setNext(event.target.value)}
          placeholder="Mínimo 8 caracteres"
          error={errors.next}
        />
        <TextField
          label="Confirmar nueva contraseña"
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder="••••••••"
          error={errors.confirm}
        />
        <Button type="submit" loading={mutation.isPending} disabled={mutation.isPending}>
          Actualizar contraseña
        </Button>
      </form>
    </Card>
  );
}
