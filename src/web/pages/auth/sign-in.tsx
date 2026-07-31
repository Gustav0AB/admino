import { useState, type FormEvent } from "react";
import { Button, Card, TextField } from "@generic/components";
import { useAuth } from "@/shared/hooks/useAuth";
import { navigate } from "@/web/navigation";

export default function SignInScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doLogin() {
    setError(null);
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError("Usuario y password son obligatorios");
      return;
    }
    setLoading(true);
    try {
      await login({ username: cleanUsername, password });
      navigate("/(drawer)", true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void doLogin();
  }

  return (
    <main className="auth-page">
      <Card className="auth-card" padding="lg">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-logo">A</div>
          <h1 className="auth-title">Admino</h1>
          <p className="auth-subtitle">Accede a tu panel operativo</p>
          <TextField
            label="Usuario"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoCapitalize="none"
            autoComplete="username"
            placeholder="usuario@dominio.com"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
          />
          {error && <p className="auth-error">{error}</p>}
          <Button
            type="button"
            loading={loading}
            loadingText="Entrando…"
            disabled={loading}
            className="auth-submit"
            onClick={() => void doLogin()}
          >
            Entrar
          </Button>
        </form>
      </Card>
    </main>
  );
}
