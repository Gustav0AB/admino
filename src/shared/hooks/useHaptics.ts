type ImpactStyle = "light" | "medium" | "heavy";
type NotificationStyle = "success" | "warning" | "error";
type HapticStyle = ImpactStyle | NotificationStyle;

export function useHaptics() {
  const trigger = (_style: HapticStyle = "light"): void => {};

  return { trigger };
}
