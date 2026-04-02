import { View, Switch, Text, StyleSheet } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { useOrgTheme } from "@/shared/theme/useOrgTheme";

type CustomSwitchProps = {
  label?: string;
  checked?: boolean;
  onCheckedChange?: (value: boolean) => void;
};

export function CustomSwitch({ label, checked, onCheckedChange }: CustomSwitchProps) {
  const c = useColors();
  const { primaryColor } = useOrgTheme();

  return (
    <View style={styles.row}>
      {label && <Text style={[styles.label, { color: c.text, flex: 1 }]}>{label}</Text>}
      <Switch
        value={checked ?? false}
        onValueChange={onCheckedChange}
        trackColor={{ false: c.border, true: primaryColor }}
        thumbColor="#FFFFFF"
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: checked ?? false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  label: { fontSize: 16, fontWeight: "600" },
});
