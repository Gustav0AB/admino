import { useState, type FormEvent } from "react";
import { Button, Card, TextField } from "@/shared/ui";
import { navigate, searchParams } from "@/web/navigation";
import { authService } from "@/shared/services/authService";

export default function ResetPasswordScreen() {
  const { token } = searchParams() as { token?: string };
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!token) { setError("Enlace inválido o incompleto"); return; }
    if (newPassword.length < 8) { setError("Mínimo 8 caracteres"); return; }
    if (newPassword !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }

    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6">
      <Card className="w-full max-w-md">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Crear nueva contraseña</h1>

          {done ? (
            <>
              <p className="text-sm text-gray-700">Tu contraseña se actualizó correctamente.</p>
              <Button variant="ghost" onClick={() => navigate("/(auth)/sign-in", true)}>
                Ir a iniciar sesión
              </Button>
            </>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <TextField
                label="Nueva contraseña"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
              />
              <TextField
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" loading={loading} loadingText="Guardando…">
                Guardar contraseña
              </Button>
            </form>
          )}
        </div>
      </Card>
    </main>
  );
}
