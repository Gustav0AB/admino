import { Image, View, Text, StyleSheet, Platform, type StyleProp, type ViewStyle } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { useOrgTheme } from "@/shared/theme/useOrgTheme";
import { BORDER_RADIUS, TYPOGRAPHY } from "@/shared/theme/tokens";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 80,
};

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
};

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  accessibilityLabel?: string;
  showBorder?: boolean;
  style?: StyleProp<ViewStyle>;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export function Avatar({
  name,
  src,
  size = "md",
  accessibilityLabel,
  showBorder = false,
  style,
}: AvatarProps) {
  const c = useColors();
  const { primaryColor } = useOrgTheme();

  const dimension = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];
  const initials = getInitials(name);
  const label = accessibilityLabel ?? `Avatar for ${name}`;

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: BORDER_RADIUS.full,
          backgroundColor: primaryColor,
          borderWidth: showBorder ? 2 : 0,
          borderColor: c.white,
        },
        style,
      ]}
      accessibilityLabel={label}
      accessibilityRole="image"
    >
      {src ? (
        <Image
          source={{ uri: src }}
          style={styles.image}
          accessibilityLabel={label}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: c.white,
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...Platform.select({
      web: {
        userSelect: "none",
      },
    }),
  },
  image: {
    width: "100%",
    height: "100%",
  },
  initials: {
    textAlign: "center",
    ...Platform.select({
      web: {
        userSelect: "none",
      },
    }),
  },
});
