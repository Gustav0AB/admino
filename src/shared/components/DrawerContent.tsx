import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { useRouter, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/shared/hooks/useColors";
import { useAuth } from "@/shared/hooks/useAuth";
import { DevRoleSwitcher } from "@/shared/components/DevRoleSwitcher";
import { useSidebarStore } from "@/shared/store/sidebarStore";
import type { UserRole } from "@/shared/types/auth";

const PERMANENT_SIDEBAR_BREAKPOINT = 1020;

type NavItem = {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
};

export function DrawerContent(props: DrawerContentComponentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { user, logout: signOut, hasAnyRole } = useAuth();
  const { isExpanded } = useSidebarStore();
  const { width } = useWindowDimensions();

  const isPermanent = width >= PERMANENT_SIDEBAR_BREAKPOINT;
  // Collapsed = permanent sidebar AND user hasn't expanded it yet
  const collapsed = isPermanent && !isExpanded;

  const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard",      href: "/(drawer)",               icon: "⊞", roles: ["SYSTEM_ADMIN", "ORGANIZATION", "CLIENT"] },
    { label: t("planning.title"), href: "/(drawer)/planning",   icon: "◫", roles: ["SYSTEM_ADMIN", "ORGANIZATION"] },
    { label: "Admin",          href: "/(drawer)/admin",         icon: "⚙", roles: ["SYSTEM_ADMIN"] },
    { label: "Layout Example", href: "/(drawer)/layout-example",icon: "⊟", roles: ["SYSTEM_ADMIN", "ORGANIZATION", "CLIENT"] },
  ];

  const visibleItems = NAV_ITEMS.filter((item) => hasAnyRole(item.roles));

  const handleSignOut = () => {
    signOut();
    router.replace("/(auth)/sign-in");
  };

  const handleNavPress = (href: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(href as any);
    // Only close the drawer on mobile (permanent sidebars stay visible)
    if (!isPermanent) {
      props.navigation.closeDrawer();
    }
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        collapsed ? styles.scrollContentCollapsed : styles.scrollContent,
        { paddingBottom: insets.bottom + 16 },
      ]}
      style={{ backgroundColor: c.background }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      {collapsed ? (
        // Icon-only: show a small brand mark centered
        <View style={styles.collapsedHeader}>
          <Text style={[styles.brandIcon, { color: c.primary }]}>A</Text>
        </View>
      ) : (
        <View style={styles.header}>
          <Text style={[styles.appName, { color: c.text }]}>admino</Text>
          <Text style={[styles.userName, { color: c.textMuted }]}>{user?.name ?? ""}</Text>
          <Text style={[styles.userRole, { color: c.textPlaceholder }]}>
            {user?.role.replace("_", " ")}
          </Text>
        </View>
      )}

      {/* ── Nav items ───────────────────────────────────────────────── */}
      <View style={collapsed ? styles.navListCollapsed : styles.navList}>
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href.replace("/(drawer)", "") ||
            (item.href === "/(drawer)" && pathname === "/");

          return (
            <TouchableOpacity
              key={item.href}
              style={[
                collapsed ? styles.navItemCollapsed : styles.navItem,
                { backgroundColor: isActive ? c.backgroundHover : "transparent" },
              ]}
              onPress={() => handleNavPress(item.href)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <Text style={[styles.navIcon, { color: isActive ? c.primary : c.textMuted }]}>
                {item.icon}
              </Text>
              {!collapsed && (
                <Text
                  style={[
                    styles.navLabel,
                    { color: isActive ? c.text : c.textMuted, fontWeight: isActive ? "600" : "400" },
                  ]}
                >
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <View style={collapsed ? styles.footerCollapsed : styles.footer}>
        <TouchableOpacity
          style={collapsed ? styles.navItemCollapsed : styles.navItem}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={[styles.navIcon, { color: c.textMuted }]}>⏻</Text>
          {!collapsed && (
            <Text style={[styles.navLabel, { color: c.textMuted }]}>{t("auth.signOut")}</Text>
          )}
        </TouchableOpacity>
        {!collapsed && <DevRoleSwitcher />}
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  // ── Scroll containers
  scrollContent:          { flex: 1 },
  scrollContentCollapsed: { flex: 1, alignItems: "center" },

  // ── Header — expanded
  header: { paddingHorizontal: 16, paddingVertical: 24, gap: 4 },
  appName:  { fontSize: 28, fontWeight: "800", letterSpacing: -1 },
  userName: { fontSize: 14 },
  userRole: { fontSize: 12, marginTop: 2, textTransform: "capitalize" },

  // ── Header — collapsed
  collapsedHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  brandIcon: {
    fontSize: 22,
    fontWeight: "800",
  },

  // ── Nav list — expanded
  navList: { flex: 1, paddingHorizontal: 8, gap: 2 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 12,
  },
  navIcon:  { fontSize: 16, width: 20, textAlign: "center" },
  navLabel: { fontSize: 15 },

  // ── Nav list — collapsed (icons only, centered)
  navListCollapsed: { flex: 1, alignItems: "center", gap: 2, paddingHorizontal: 0 },
  navItemCollapsed: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },

  // ── Footer
  footer:         { paddingHorizontal: 8, gap: 2 },
  footerCollapsed: { alignItems: "center", gap: 2 },
});
