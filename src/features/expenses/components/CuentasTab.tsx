import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { SPACING, TYPOGRAPHY } from "@/shared/theme/tokens";
import { AccountsTab } from "./AccountsTab";
import { CreditCardsTab } from "./CreditCardsTab";
import { LoansTab } from "./LoansTab";
import { SavingsTab } from "./SavingsTab";

const SUB_TABS = [
  { key: "cuentas", label: "Cuentas" },
  { key: "tarjetas", label: "Tarjetas" },
  { key: "prestamos", label: "Préstamos" },
  { key: "ahorro", label: "Ahorro" },
] as const;

type SubTab = (typeof SUB_TABS)[number]["key"];

export function CuentasTab() {
  const c = useColors();
  const [active, setActive] = useState<SubTab>("cuentas");

  return (
    <View style={styles.root}>
      <View style={[styles.bar, { borderBottomColor: c.border, backgroundColor: c.backgroundStrong }]}>
        {SUB_TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && [styles.tabActive, { borderBottomColor: c.primary }]]}
              onPress={() => setActive(tab.key)}
            >
              <Text style={[styles.tabText, { color: isActive ? c.primary : c.textMuted }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {active === "cuentas" && <AccountsTab />}
      {active === "tarjetas" && <CreditCardsTab />}
      {active === "prestamos" && <LoansTab />}
      {active === "ahorro" && <SavingsTab />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {},
  tabText: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "600" },
});
