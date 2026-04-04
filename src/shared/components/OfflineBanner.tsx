import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { SPACING, TYPOGRAPHY, Z_INDEX } from "@/shared/theme/tokens";

const BANNER_HEIGHT = 36;
const ANIMATION_DURATION = 260;

export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const translateY = useRef(new Animated.Value(-BANNER_HEIGHT)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isConnected ? -BANNER_HEIGHT : 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [isConnected]);

  return (
    <Animated.View
      style={[
        styles.banner,
        { top: insets.top, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLabel="No internet connection"
    >
      <View style={styles.dot} />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    backgroundColor: "#1C1C1E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    zIndex: Z_INDEX.modal + 10,
    paddingHorizontal: SPACING.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  text: {
    color: "#FFFFFF",
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: "500",
  },
});
