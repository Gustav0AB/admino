import { View, Text } from "react-native";
import { MainLayout } from "@/shared/components/MainLayout";
import { RoleGuard } from "@/shared/components/RoleGuard";
import { useColors } from "@/shared/hooks/useColors";

export default function AdminScreen() {
  const c = useColors();

  return (
    <RoleGuard allowedRoles={["SYSTEM_ADMIN"]}>
      <MainLayout scrollable>
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 32, fontWeight: "800", color: c.text }}>Admin</Text>
          <Text style={{ color: c.textMuted }}>System administration panel.</Text>
        </View>
      </MainLayout>
    </RoleGuard>
  );
}
