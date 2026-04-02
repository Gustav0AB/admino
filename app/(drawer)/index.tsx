import { useTranslation } from "react-i18next";
import { View, Text, Switch } from "react-native";
import { MainLayout } from "@/shared/components/MainLayout";
import { useThemeStore } from "@/shared/store/themeStore";
import { useColors } from "@/shared/hooks/useColors";
import { useOrgTheme } from "@/shared/theme/useOrgTheme";

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { mode, toggle } = useThemeStore();
  const c = useColors();
  const { primaryColor } = useOrgTheme();

  return (
    <MainLayout scrollable>
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 32, fontWeight: "800", color: c.text }}>Dashboard</Text>
        <Text style={{ color: c.textMuted }}>{t("entities.client_plural")}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: c.text, flex: 1 }}>
            Dark Mode
          </Text>
          <Switch
            value={mode === "dark"}
            onValueChange={toggle}
            trackColor={{ false: c.border, true: primaryColor }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    </MainLayout>
  );
}
