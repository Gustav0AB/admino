import React from "react";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { useRouter, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  MaterialIcons,
  Feather,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/shared/hooks/useColors";
import { useAuth } from "@/shared/hooks/useAuth";
import { DevRoleSwitcher } from "@/shared/components/DevRoleSwitcher";
import { useSidebarStore } from "@/shared/store/sidebarStore";
import { useClientStore } from "@/shared/store/clientStore";
import type { UserRole } from "@/shared/types/auth";
import type { ClientFeature } from "@/shared/types/client";

const PERMANENT_SIDEBAR_BREAKPOINT = 1020;

type NavItem = {
  label: string;
  href: string;
  icon: (color: string) => React.ReactNode;
  roles: UserRole[];
  feature?: ClientFeature;
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
  const { hasFeature, branding } = useClientStore();

  const isPermanent = width >= PERMANENT_SIDEBAR_BREAKPOINT;
  // Collapsed = permanent sidebar AND user hasn't expanded it yet
  const collapsed = isPermanent && !isExpanded;

  const isSystemAdmin = user?.role === "SYSTEM_ADMIN";

  const NAV_ITEMS: NavItem[] = [
    {
      label: "Dashboard",
      href: "/(drawer)",
      icon: (color) => (
        <MaterialIcons name="dashboard" size={20} color={color} />
      ),
      roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN", "MEMBER"],
    },
    {
      label: "Administración",
      href: "/(drawer)/admin",
      icon: (color) => <Feather name="settings" size={20} color={color} />,
      roles: ["SYSTEM_ADMIN"],
    },
    {
      label: "Finanzas",
      href: "/(drawer)/expenses",
      icon: (color) => (
        <MaterialIcons name="attach-money" size={20} color={color} />
      ),
      roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
      feature: "finanzas",
    },
    {
      label: "Gestión Atletas",
      href: "/(drawer)/athlete-dashboard",
      icon: (color) => (
        <MaterialCommunityIcons name="weight-lifter" size={20} color={color} />
      ),
      roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
      feature: "athlete_dashboard",
    },
    {
      label: "Mi Entrenamiento",
      href: "/(drawer)/athlete-tracker",
      icon: (color) => <FontAwesome5 name="running" size={20} color={color} />,
      roles: ["MEMBER"],
      feature: "athlete_tracker",
    },
    // Payments, Patients, Log Access, Nutritionist Planning — not yet ready
    // {
    //   label: "Payments",
    //   href: "/(drawer)/payments",
    //   icon: (color) => <MaterialIcons name="attach-money" size={20} color={color} />,
    //   roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    //   feature: "payments",
    // },
    // {
    //   label: "Patients",
    //   href: "/(drawer)/patients",
    //   icon: (color) => <MaterialIcons name="food-bank" size={20} color={color} />,
    //   roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    //   feature: "patients",
    // },
    // {
    //   label: "Log Access",
    //   href: "/(drawer)/log-access",
    //   icon: (color) => <AntDesign name="qrcode" size={20} color={color} />,
    //   roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    //   feature: "log_access",
    // },
    // {
    //   label: "Nutritionist Planning",
    //   href: "/(drawer)/nutritionist-planning",
    //   icon: (color) => <FontAwesome6 name="weight-scale" size={20} color={color} />,
    //   roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
    //   feature: "nutritionist_planning",
    // },
    {
      label: "Configuración",
      href: "/(drawer)/client-settings",
      icon: (color) => <Feather name="sliders" size={20} color={color} />,
      roles: ["OWNER", "ADMIN"],
    },
  ];

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!hasAnyRole(item.roles)) return false;
    // SYSTEM_ADMIN bypasses the feature gate — they see everything
    if (item.feature && !isSystemAdmin && !hasFeature(item.feature))
      return false;
    return true;
  });

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
        <View style={styles.collapsedHeader}>
          {branding.logoUrl ? (
            <Image
              source={{ uri: branding.logoUrl }}
              style={styles.logoCollapsed}
              resizeMode="contain"
            />
          ) : (
            <Text style={[styles.brandIcon, { color: c.primary }]}>
              {branding.orgName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.header}>
          {/* Logo above org name */}
          <View
            style={[
              styles.logoBox,
              { borderColor: c.border, backgroundColor: c.backgroundStrong },
            ]}
          >
            {branding.logoUrl ? (
              <Image
                source={{ uri: branding.logoUrl }}
                style={styles.logoExpanded}
                resizeMode="contain"
              />
            ) : (
              <Text style={[styles.logoInitial, { color: c.primary }]}>
                {branding.orgName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={[styles.appName, { color: c.text }]}>
            {branding.orgName}
          </Text>
          <Text style={[styles.userName, { color: c.textMuted }]}>
            {user?.name ?? ""}
          </Text>
          <Text style={[styles.userRole, { color: c.textPlaceholder }]}>
            {user?.role?.replace("_", " ")}
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
                {
                  backgroundColor: isActive ? c.backgroundHover : "transparent",
                },
              ]}
              onPress={() => handleNavPress(item.href)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={styles.navIcon}>
                {item.icon(isActive ? c.primary : c.textMuted)}
              </View>
              {!collapsed && (
                <Text
                  style={[
                    styles.navLabel,
                    {
                      color: isActive ? c.text : c.textMuted,
                      fontWeight: isActive ? "600" : "400",
                    },
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
            <Text style={[styles.navLabel, { color: c.textMuted }]}>
              {t("auth.signOut")}
            </Text>
          )}
        </TouchableOpacity>
        {!collapsed && <DevRoleSwitcher />}
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  // ── Scroll containers
  scrollContent: { flex: 1 },
  scrollContentCollapsed: { flex: 1, alignItems: "center" },

  // ── Header — expanded
  header: { paddingHorizontal: 16, paddingVertical: 24, gap: 4 },
  appName: { fontSize: 28, fontWeight: "800", letterSpacing: -1 },
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
  navIcon: { width: 20, alignItems: "center" },
  navLabel: { fontSize: 15 },

  // ── Nav list — collapsed (icons only, centered)
  navListCollapsed: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 0,
  },
  navItemCollapsed: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },

  // ── Logo
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoExpanded: { width: 48, height: 48 },
  logoCollapsed: { width: 32, height: 32 },
  logoInitial: { fontSize: 20, fontWeight: "800" },

  // ── Footer
  footer: { paddingHorizontal: 8, gap: 2 },
  footerCollapsed: { alignItems: "center", gap: 2 },
});
