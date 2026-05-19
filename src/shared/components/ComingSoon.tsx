import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/shared/hooks/useColors";

type Props = {
  featureName: string;
};

export function ComingSoon({ featureName }: Props) {
  const c = useColors();
  return (
    <View style={styles.container}>
      <Text style={[styles.emoji]}>🚧</Text>
      <Text style={[styles.title, { color: c.text }]}>{featureName}</Text>
      <Text style={[styles.subtitle, { color: c.textMuted }]}>Coming soon</Text>
      <Text style={[styles.description, { color: c.textPlaceholder }]}>
        This feature is under development and will be available in a future update.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 320,
  },
});
