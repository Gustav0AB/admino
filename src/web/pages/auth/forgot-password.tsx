import { useState, type FormEvent } from "react";
import { Button, Card, TextField } from "@/shared/ui";
import { back, navigate } from "@/web/navigation";
import { authService } from "@/shared/services/authService";

export default function ForgotPasswordScreen() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await authService.forgotPassword(username.trim());
      setMessage(res.message);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6">
      <Card className="w-full max-w-md">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Restablecer contraseña</h1>
          <p className="text-sm text-gray-500">
            Ingresa tu usuario o email y te enviaremos instrucciones para crear una nueva contraseña.
          </p>

          {message ? (
            <>
              <p className="text-sm text-gray-700">{message}</p>
              <Button variant="ghost" onClick={() => navigate("/(auth)/sign-in", true)}>
                Volver a iniciar sesión
              </Button>
            </>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <TextField
                label="Usuario o email"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoCapitalize="none"
                autoComplete="username"
              />
              <Button type="submit" disabled={!username.trim()} loading={loading} loadingText="Enviando…">
                Enviar instrucciones
              </Button>
              <Button type="button" variant="ghost" onClick={back}>
                Cancelar
              </Button>
            </form>
          )}
        </div>
      </Card>
    </main>
  );
}
