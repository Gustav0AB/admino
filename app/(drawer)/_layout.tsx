import { Redirect } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useTranslation } from "react-i18next";
import { Platform, useWindowDimensions } from "react-native";
import { AppHeader } from "@/shared/components/AppHeader";
import { DrawerContent } from "@/shared/components/DrawerContent";
import { useAuth } from "@/shared/hooks/useAuth";
import { useSidebarStore } from "@/shared/store/sidebarStore";

export const PERMANENT_SIDEBAR_BREAKPOINT = 1020;
export const SIDEBAR_COLLAPSED_W = 60;
export const SIDEBAR_EXPANDED_W = 220;

export default function DrawerLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isInitialized } = useAuth();
  const { width } = useWindowDimensions();
  const { isExpanded } = useSidebarStore();

  const isPermanent = width >= PERMANENT_SIDEBAR_BREAKPOINT;

  if (isInitialized && !isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const desktopDrawerStyle = {
    width: isExpanded ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W,
    // Smooth CSS transition on web — no extra lib needed
    ...Platform.select({
      web: { transition: "width 0.22s ease" } as object,
    }),
  };

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        header: (props) => <AppHeader {...props} isPermanent={isPermanent} />,
        drawerType: isPermanent ? "permanent" : "front",
        drawerStyle: isPermanent ? desktopDrawerStyle : { width: "80%" },
        swipeEnabled: !isPermanent,
        // Never hide the header-left — AppHeader always renders the toggle button
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
      <Drawer.Screen
        name="layout-example"
        options={{ title: "Layout Example", drawerLabel: "Layout Example" }}
      />
    </Drawer>
  );
}
