import { Text, type TextProps } from "react-native";
import { useColors } from "@/shared/hooks/useColors";

export function H1({ style, ...props }: TextProps) {
  const c = useColors();
  return (
    <Text
      accessibilityRole="header"
      style={[{ fontSize: 32, fontWeight: "800", letterSpacing: -1, color: c.primary }, style]}
      {...props}
    />
  );
}

export function H2({ style, ...props }: TextProps) {
  const c = useColors();
  return (
    <Text
      accessibilityRole="header"
      style={[{ fontSize: 24, fontWeight: "700", letterSpacing: -0.5, color: c.primary }, style]}
      {...props}
    />
  );
}

export function H3({ style, ...props }: TextProps) {
  const c = useColors();
  return (
    <Text
      accessibilityRole="header"
      style={[{ fontSize: 20, fontWeight: "600", color: c.primary }, style]}
      {...props}
    />
  );
}

export function Body({ style, ...props }: TextProps) {
  const c = useColors();
  return (
    <Text style={[{ fontSize: 16, fontWeight: "400", color: c.text }, style]} {...props} />
  );
}

export function BodyStrong({ style, ...props }: TextProps) {
  const c = useColors();
  return (
    <Text style={[{ fontSize: 16, fontWeight: "600", color: c.text }, style]} {...props} />
  );
}

export function Caption({ style, ...props }: TextProps) {
  const c = useColors();
  return (
    <Text style={[{ fontSize: 12, fontWeight: "400", color: c.textMuted }, style]} {...props} />
  );
}
