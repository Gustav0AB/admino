import { useState } from "react";
import { View, Text } from "react-native";
import { MainLayout } from "@/shared/components/MainLayout";
import { useColors } from "@/shared/hooks/useColors";
import { useClientTheme } from "@/shared/theme/useClientTheme";
import { SPACING } from "@/shared/theme/tokens";

export default function DashboardScreen() {
  const c = useColors();
  const { primaryColor } = useClientTheme();

  return (
    <MainLayout scrollable padding={false}>
      <View>
        <Text style={{ fontSize: 32, fontWeight: "800", color: c.text }}>
          Dashboard
        </Text>
        <Text style={{ color: c.textMuted }}>
          Welcome to the dashboard! This is where you can find an overview of
          your data and quick access to important features.
        </Text>
      </View>
    </MainLayout>
  );
}
