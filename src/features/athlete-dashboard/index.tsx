import { View, StyleSheet } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { CalendarScreen } from "./calendar";

export function AthleteDashboardScreen() {
  const c = useColors();

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <CalendarScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
