import { useTranslation } from "react-i18next";
import { View, Text } from "react-native";
import { MainLayout } from "@/shared/components/MainLayout";
import { useColors } from "@/shared/hooks/useColors";

export default function PlanningScreen() {
  const { t } = useTranslation();
  const c = useColors();

  return (
    <MainLayout scrollable>
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 32, fontWeight: "800", color: c.text }}>
          {t("planning.title")}
        </Text>
        <Text style={{ color: c.textMuted }}>{t("planning.newSession")}</Text>
      </View>
    </MainLayout>
  );
}
