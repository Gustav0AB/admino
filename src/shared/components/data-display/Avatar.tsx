import { Image, View, Text, StyleSheet } from "react-native";
import { useColors } from "@/shared/hooks/useColors";

type AvatarSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<AvatarSize, number> = { sm: 32, md: 44, lg: 64 };
const FONT_SIZE_MAP: Record<AvatarSize, number> = { sm: 12, md: 16, lg: 22 };

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  accessibilityLabel?: string;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name, src, size = "md", accessibilityLabel }: AvatarProps) {
  const c = useColors();
  const dimension = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];
  const initials = getInitials(name);
  const label = accessibilityLabel ?? name;

  return (
    <View
      style={[
        styles.circle,
        { width: dimension, height: dimension, borderRadius: dimension / 2, backgroundColor: c.secondary },
      ]}
      accessibilityLabel={label}
      accessibilityRole="image"
    >
      {src ? (
        <Image
          source={{ uri: src }}
          style={{ width: dimension, height: dimension }}
          accessibilityLabel={label}
        />
      ) : (
        <Text style={{ color: "#fff", fontSize, fontWeight: "700" }}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
