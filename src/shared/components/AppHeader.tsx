import { DrawerHeaderProps } from "@react-navigation/drawer";
import { DrawerActions } from "@react-navigation/native";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/shared/hooks/useColors";

export function AppHeader({ navigation, options }: DrawerHeaderProps) {
  const insets = useSafeAreaInsets();
  const c = useColors();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          height: 56 + insets.top,
          backgroundColor: c.background,
          borderBottomColor: c.border,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
        accessibilityLabel="Toggle menu"
        accessibilityRole="button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.menuIcon, { color: c.text }]}>☰</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
        {options.title ?? ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  menuButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  menuIcon: {
    fontSize: 20,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
  },
});
