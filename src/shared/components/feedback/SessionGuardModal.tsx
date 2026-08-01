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
  const title = isOffline ? "No internet connection" : "Session expiring";
  const body = isOffline
    ? `You're offline. You'll be logged out automatically in ${secondsLeft}s unless the connection is restored.`
    : `Your session expires in ${formatSeconds(secondsLeft)}. Would you like to stay logged in?`;

  return (
    <Modal
      open={visible}
      onClose={() => {}}
      title={title}
      footer={
        <>
          {!isOffline && <Button onClick={onStayLoggedIn}>Stay logged in</Button>}
          <Button variant="ghost" onClick={onLogout}>{isOffline ? "Logout now" : "Logout"}</Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-gray-600">{body}</p>
    </Modal>
  );
}
