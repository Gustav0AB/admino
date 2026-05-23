import { View, StyleSheet } from "react-native";
import { PlanCalendar } from "./PlanCalendar";

export function CalendarScreen() {
  return (
    <View style={styles.container}>
      <PlanCalendar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignSelf: "stretch",
  },
});
