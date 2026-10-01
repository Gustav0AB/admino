import { Button, Modal } from "@/shared/ui";
import { useSessionGuard } from "@/shared/hooks/useSessionGuard";

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SessionGuardModal() {
  const { visible, type, secondsLeft, onStayLoggedIn, onLogout } = useSessionGuard();
  if (!type) return null;

  const isOffline = type === "offline";
  const title = isOffline ? "Sin conexión a internet" : "Sesión por expirar";
  const body = isOffline
    ? `No hay conexión. La sesión se cerrará automáticamente en ${secondsLeft}s si no se restablece.`
    : `Tu sesión expira en ${formatSeconds(secondsLeft)}. ¿Quieres mantenerla activa?`;

  return (
    <Modal
      open={visible}
      onClose={() => {}}
      title={title}
      footer={
        <>
          {!isOffline && <Button onClick={onStayLoggedIn}>Mantener sesión</Button>}
          <Button variant="ghost" onClick={onLogout}>{isOffline ? "Salir ahora" : "Cerrar sesión"}</Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-gray-600">{body}</p>
    </Modal>
  );
}
