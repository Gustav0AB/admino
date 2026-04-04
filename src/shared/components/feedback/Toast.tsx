import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS, Z_INDEX } from "@/shared/theme/tokens";

type ToastType = "success" | "error" | "warning" | "info";

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
};

type ToastOptions = {
  duration?: number;
};

type ToastContextValue = {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_CONFIG: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: "#16A34A", icon: "✓" },
  error:   { bg: "#DC2626", icon: "✕" },
  warning: { bg: "#D97706", icon: "⚠" },
  info:    { bg: "#2563EB", icon: "ℹ" },
};

const DEFAULT_DURATION = 3500;
const ANIMATION_DURATION = 280;

function ToastEntry({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const translateY = useRef(
    new Animated.Value(Platform.OS === "web" ? -20 : 60)
  ).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = TOAST_CONFIG[item.type];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: Platform.OS === "web" ? -20 : 60,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }, item.duration);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onDismiss}
        style={[styles.toast, { backgroundColor: config.bg, ...SHADOWS.md }]}
        accessibilityRole="alert"
        accessibilityLabel={item.message}
      >
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{config.icon}</Text>
        </View>
        <Text style={styles.message} numberOfLines={3}>
          {item.message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, message: string, options?: ToastOptions) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [
      ...prev.slice(-3),
      { id, type, message, duration: options?.duration ?? DEFAULT_DURATION },
    ]);
  }, []);

  const value: ToastContextValue = {
    success: (m, o) => add("success", m, o),
    error:   (m, o) => add("error", m, o),
    warning: (m, o) => add("warning", m, o),
    info:    (m, o) => add("info", m, o),
  };

  const containerStyle = Platform.OS === "web"
    ? styles.containerWeb
    : [styles.containerNative, { bottom: insets.bottom + SPACING.lg }];

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={[containerStyle, styles.pointerNone]} pointerEvents="box-none">
        {toasts.map((item) => (
          <ToastEntry key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const styles = StyleSheet.create({
  containerWeb: {
    position: "absolute",
    top: SPACING.lg,
    right: SPACING.lg,
    zIndex: Z_INDEX.modal + 1,
    gap: SPACING.sm,
    maxWidth: 360,
    width: "100%",
    ...(Platform.OS === "web" ? ({ alignItems: "flex-end" } as object) : {}),
  },
  containerNative: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: Z_INDEX.modal + 1,
    gap: SPACING.sm,
  },
  pointerNone: {},
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    color: "#FFFFFF",
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: "700",
  },
  message: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
    lineHeight: 20,
  },
});
