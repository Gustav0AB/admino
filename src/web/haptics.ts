export const ImpactFeedbackStyle = { Light: "light", Medium: "medium", Heavy: "heavy" } as const;
export const NotificationFeedbackType = { Success: "success", Warning: "warning", Error: "error" } as const;
export type ImpactFeedbackStyle = string;
export type NotificationFeedbackType = string;
export const impactAsync = (_style?: unknown) => Promise.resolve();
export const notificationAsync = (_style?: unknown) => Promise.resolve();
