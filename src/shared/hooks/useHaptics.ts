import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

type ImpactStyle = "light" | "medium" | "heavy";
type NotificationStyle = "success" | "warning" | "error";
type HapticStyle = ImpactStyle | NotificationStyle;

const IMPACT_MAP: Record<ImpactStyle, Haptics.ImpactFeedbackStyle> = {
  light:  Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy:  Haptics.ImpactFeedbackStyle.Heavy,
};

const NOTIFICATION_MAP: Record<NotificationStyle, Haptics.NotificationFeedbackType> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error:   Haptics.NotificationFeedbackType.Error,
};

const isImpactStyle = (style: HapticStyle): style is ImpactStyle =>
  style === "light" || style === "medium" || style === "heavy";

export function useHaptics() {
  const trigger = (style: HapticStyle = "light"): void => {
    if (Platform.OS === "web") return;

    if (isImpactStyle(style)) {
      void Haptics.impactAsync(IMPACT_MAP[style]);
    } else {
      void Haptics.notificationAsync(NOTIFICATION_MAP[style]);
    }
  };

  return { trigger };
}
