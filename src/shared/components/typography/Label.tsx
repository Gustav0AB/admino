import { View, Text, StyleSheet, type TextProps, type StyleProp, type ViewStyle } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { TYPOGRAPHY, FONTS } from "@/shared/theme/tokens";

type ContentBlockProps = {
  title?: string;
  paragraph?: string;
  style?: StyleProp<ViewStyle>;
};

export function ContentBlock({ title, paragraph, style }: ContentBlockProps) {
  const c = useColors();

  return (
    <View style={[styles.container, style]}>
      {title && <Text style={[styles.title, { color: c.text }]}>{title}</Text>}
      {paragraph && (
        <Text style={[styles.paragraph, { color: c.textMuted }]}>
          {paragraph}
        </Text>
      )}
    </View>
  );
}

// Typography components
type TypographyProps = TextProps & {
  variant?: "default" | "muted";
};

export function H1({ variant = "default", style, ...props }: TypographyProps) {
  const c = useColors();
  const color = variant === "muted" ? c.textMuted : c.text;
  return <Text style={[styles.h1, { color }, style]} {...props} />;
}

export function H2({ variant = "default", style, ...props }: TypographyProps) {
  const c = useColors();
  const color = variant === "muted" ? c.textMuted : c.text;
  return <Text style={[styles.h2, { color }, style]} {...props} />;
}

export function H3({ variant = "default", style, ...props }: TypographyProps) {
  const c = useColors();
  const color = variant === "muted" ? c.textMuted : c.text;
  return <Text style={[styles.h3, { color }, style]} {...props} />;
}

export function H4({ variant = "default", style, ...props }: TypographyProps) {
  const c = useColors();
  const color = variant === "muted" ? c.textMuted : c.text;
  return <Text style={[styles.h4, { color }, style]} {...props} />;
}

export function Body({ variant = "default", style, ...props }: TypographyProps) {
  const c = useColors();
  const color = variant === "muted" ? c.textMuted : c.text;
  return <Text style={[styles.body, { color }, style]} {...props} />;
}

export function BodyStrong({ variant = "default", style, ...props }: TypographyProps) {
  const c = useColors();
  const color = variant === "muted" ? c.textMuted : c.text;
  return <Text style={[styles.bodyStrong, { color }, style]} {...props} />;
}

export function Caption({ variant = "default", style, ...props }: TypographyProps) {
  const c = useColors();
  const color = variant === "muted" ? c.textMuted : c.text;
  return <Text style={[styles.caption, { color }, style]} {...props} />;
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  // ContentBlock uses Instrument Sans for title, Inter for paragraph
  title: {
    fontFamily: FONTS.heading.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  paragraph: {
    fontFamily: FONTS.body.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  // Headings — Instrument Sans
  h1: {
    fontFamily: FONTS.heading.bold,
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: FONTS.heading.bold,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: FONTS.heading.semibold,
    fontSize: TYPOGRAPHY.fontSize.xl,
    lineHeight: 28,
  },
  h4: {
    fontFamily: FONTS.heading.semibold,
    fontSize: TYPOGRAPHY.fontSize.lg,
    lineHeight: 24,
  },
  // Body — Inter
  body: {
    fontFamily: FONTS.body.regular,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: FONTS.body.semibold,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 24,
  },
  caption: {
    fontFamily: FONTS.body.medium,
    fontSize: TYPOGRAPHY.fontSize.xs,
    lineHeight: 16,
  },
});
