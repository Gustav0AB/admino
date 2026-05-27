import { Text, View } from "react-native";
import { CustomModal } from "@/shared/components/feedback/CustomModal";
import { CustomButton } from "@/shared/components/inputs/CustomButton";
import { useSessionGuard } from "@/shared/hooks/useSessionGuard";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { useColors } from "@/shared/hooks/useColors";

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SessionGuardModal() {
  const { visible, type, secondsLeft, onStayLoggedIn, onLogout } = useSessionGuard();
  const c = useColors();

  if (!type) return null;

  const isOffline = type === "offline";

  const title = isOffline ? "No internet connection" : "Session expiring";

  const body = isOffline
    ? `You're offline. You'll be logged out automatically in ${secondsLeft}s unless the connection is restored.`
    : `Your session expires in ${formatSeconds(secondsLeft)}. Would you like to stay logged in?`;

  return (
    <CustomModal
      open={visible}
      onOpenChange={() => {}}
      title={title}
      closable={false}
      size="sm"
      footer={
        <View style={{ flex: 1, gap: SPACING.sm }}>
          {!isOffline && (
            <CustomButton onPress={onStayLoggedIn} variant="primary">
              Stay logged in
            </CustomButton>
          )}
          <CustomButton onPress={onLogout} variant="outline">
            {isOffline ? "Logout now" : "Logout"}
          </CustomButton>
        </View>
      }
    >
      <Text
        style={{
          fontSize: TYPOGRAPHY.fontSize.sm,
          color: c.textMuted,
          lineHeight: TYPOGRAPHY.fontSize.sm * 1.5,
        }}
      >
        {body}
      </Text>
    </CustomModal>
  );
}
