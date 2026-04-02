import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useColors } from "@/shared/hooks/useColors";

function SkeletonItem({
  width = "100%",
  height = 14,
  borderRadius = 6,
}: {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
}) {
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
      style={[{ width, height, borderRadius, backgroundColor: c.border }, animatedStyle]}
    />
  );
}

export function DataTableSkeleton({ rows = 5 }: { rows?: number }) {
  const c = useColors();
  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.headerRow, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <SkeletonItem width="30%" height={12} />
        <SkeletonItem width="20%" height={12} />
        <SkeletonItem width="20%" height={12} />
      </View>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.dataRow}>
          <SkeletonItem width={36} height={36} borderRadius={18} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonItem width="55%" height={13} />
            <SkeletonItem width="35%" height={11} />
          </View>
          <SkeletonItem width={60} height={22} borderRadius={11} />
        </View>
      ))}
    </View>
  );
}

export function CardSkeleton() {
  const c = useColors();
  return (
    <View style={[styles.card, { borderColor: c.border }]}>
      <View style={styles.dataRow}>
        <SkeletonItem width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonItem width="65%" height={15} />
          <SkeletonItem width="45%" height={12} />
        </View>
      </View>
      <SkeletonItem height={12} />
      <SkeletonItem width="85%" height={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  dataRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
});
