import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { useRouter, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/shared/hooks/useColors";
import { useAuth } from "@/shared/hooks/useAuth";
import { DevRoleSwitcher } from "@/shared/components/DevRoleSwitcher";
import type { UserRole } from "@/shared/types/auth";

type NavItem = {
  label: string;
  href: "/(drawer)" | "/(drawer)/planning" | "/(drawer)/admin";
  icon: string;
  roles: UserRole[];
};

export function DrawerContent(props: DrawerContentComponentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { user, signOut, hasAnyRole } = useAuth();

  const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", href: "/(drawer)", icon: "⊞", roles: ["SYSTEM_ADMIN", "ORGANIZATION", "CLIENT"] },
    { label: t("planning.title"), href: "/(drawer)/planning", icon: "◫", roles: ["SYSTEM_ADMIN", "ORGANIZATION"] },
    { label: "Admin", href: "/(drawer)/admin", icon: "⚙", roles: ["SYSTEM_ADMIN"] },
  ];

  const visibleItems = NAV_ITEMS.filter((item) => hasAnyRole(item.roles));

  const handleSignOut = () => {
    signOut();
    router.replace("/(auth)/sign-in");
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
      style={{ backgroundColor: c.background }}
    >
      <View style={styles.header}>
        <Text style={[styles.appName, { color: c.text }]}>admino</Text>
        <Text style={[styles.userName, { color: c.textMuted }]}>{user?.name ?? ""}</Text>
        <Text style={[styles.userRole, { color: c.textPlaceholder }]}>
          {user?.role.replace("_", " ")}
        </Text>
      </View>

      <View style={styles.navList}>
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href.replace("/(drawer)", "") ||
            (item.href === "/(drawer)" && pathname === "/");
          return (
            <TouchableOpacity
              key={item.href}
              style={[
                styles.navItem,
                { backgroundColor: isActive ? c.backgroundHover : "transparent" },
              ]}
              onPress={() => {
                router.push(item.href);
                props.navigation.closeDrawer();
              }}
              accessibilityRole="button"
            >
              <Text style={[styles.navIcon, { color: isActive ? c.primary : c.textMuted }]}>
                {item.icon}
              </Text>
              <Text style={[styles.navLabel, { color: isActive ? c.text : c.textMuted, fontWeight: isActive ? "600" : "400" }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={handleSignOut}
          accessibilityRole="button"
        >
          <Text style={[styles.navIcon, { color: c.textMuted }]}>⏻</Text>
          <Text style={[styles.navLabel, { color: c.textMuted }]}>{t("auth.signOut")}</Text>
        </TouchableOpacity>
        <DevRoleSwitcher />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 24, gap: 4 },
  appName: { fontSize: 28, fontWeight: "800", letterSpacing: -1 },
  userName: { fontSize: 14 },
  userRole: { fontSize: 12, marginTop: 2, textTransform: "capitalize" },
  navList: { flex: 1, paddingHorizontal: 8, gap: 2 },
  footer: { paddingHorizontal: 8, gap: 2 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 12,
  },
  navIcon: { fontSize: 16, width: 20, textAlign: "center" },
  navLabel: { fontSize: 15 },
});
