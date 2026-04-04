import { useEffect, type ReactElement } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, BORDER_RADIUS } from "@/shared/theme/tokens";

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
};

export function Skeleton({
  width = "100%",
  height = 14,
  radius = BORDER_RADIUS.sm,
}: SkeletonProps) {
  const c = useColors();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: c.border }, animatedStyle]}
    />
  );
}

type SkeletonPreset = "list" | "card" | "form" | "stat";

type SkeletonFactoryOptions = {
  rows?: number;
};

export function skeletonFactory(
  preset: SkeletonPreset,
  options: SkeletonFactoryOptions = {}
): ReactElement {
  const rows = options.rows ?? 4;

  switch (preset) {
    case "list":
      return (
        <View style={{ gap: SPACING.md }}>
          {Array.from({ length: rows }).map((_, i) => (
            <View key={i} style={styles.listRow}>
              <Skeleton width={44} height={44} radius={BORDER_RADIUS.full} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="55%" height={14} />
                <Skeleton width="35%" height={12} />
              </View>
              <Skeleton width={64} height={24} radius={BORDER_RADIUS.full} />
            </View>
          ))}
        </View>
      );

    case "card":
      return (
        <View style={{ gap: SPACING.md }}>
          {Array.from({ length: rows }).map((_, i) => (
            <View key={i} style={styles.card}>
              <View style={styles.listRow}>
                <Skeleton width={48} height={48} radius={BORDER_RADIUS.lg} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Skeleton width="65%" height={15} />
                  <Skeleton width="40%" height={12} />
                </View>
              </View>
              <Skeleton height={12} />
              <Skeleton width="80%" height={12} />
            </View>
          ))}
        </View>
      );

    case "form":
      return (
        <View style={{ gap: SPACING.lg }}>
          {Array.from({ length: rows }).map((_, i) => (
            <View key={i} style={{ gap: SPACING.xs }}>
              <Skeleton width="30%" height={12} />
              <Skeleton height={44} radius={BORDER_RADIUS.md} />
            </View>
          ))}
          <Skeleton height={44} radius={BORDER_RADIUS.md} width="50%" />
        </View>
      );

    case "stat":
      return (
        <View style={styles.statGrid}>
          {Array.from({ length: rows }).map((_, i) => (
            <View key={i} style={styles.statCard}>
              <Skeleton width="60%" height={12} />
              <Skeleton width="40%" height={28} />
              <Skeleton width="50%" height={11} />
            </View>
          ))}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  card: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
});
