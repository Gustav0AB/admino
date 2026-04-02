import { Redirect } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useTranslation } from "react-i18next";
import { useWindowDimensions } from "react-native";
import { AppHeader } from "@/shared/components/AppHeader";
import { DrawerContent } from "@/shared/components/DrawerContent";
import { useAuth } from "@/shared/hooks/useAuth";

const PERMANENT_SIDEBAR_BREAKPOINT = 1020;

export default function DrawerLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isHydrated } = useAuth();
  const { width } = useWindowDimensions();
  const isPermanent = width >= PERMANENT_SIDEBAR_BREAKPOINT;

  if (isHydrated && !isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        header: (props) => <AppHeader {...props} />,
        drawerType: isPermanent ? "permanent" : "front",
        drawerStyle: { width: isPermanent ? 260 : "80%" },
        swipeEnabled: !isPermanent,
        headerLeft: isPermanent ? () => null : undefined,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{ title: "Dashboard", drawerLabel: "Dashboard" }}
      />
      <Drawer.Screen
        name="planning"
        options={{
          title: t("planning.title"),
          drawerLabel: t("planning.title"),
        }}
      />
      <Drawer.Screen
        name="admin"
        options={{ title: "Admin", drawerLabel: "Admin" }}
      />
    </Drawer>
  );
}
