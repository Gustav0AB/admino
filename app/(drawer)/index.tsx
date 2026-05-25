import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { MainLayout } from "@/shared/components/MainLayout";
import { useColors } from "@/shared/hooks/useColors";
import { useAuth } from "@/shared/hooks/useAuth";
import { useClientStore } from "@/shared/store/clientStore";
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from "@/shared/theme/tokens";
import type { ClientFeature } from "@/shared/types/client";

type FeatureCard = {
  feature: ClientFeature | null;
  label: string;
  description: string;
  href: string;
  icon: (color: string) => React.ReactNode;
  roles: string[];
};

const FEATURE_CARDS: FeatureCard[] = [
  {
    feature: "finanzas",
    label: "Finanzas",
    description: "Gestiona ingresos, egresos y balances.",
    href: "/(drawer)/expenses",
    icon: (color) => <MaterialIcons name="attach-money" size={28} color={color} />,
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
  },
  {
    feature: "athlete_dashboard",
    label: "Athlete Dashboard",
    description: "Atletas, planes de entrenamiento y calendario.",
    href: "/(drawer)/athlete-dashboard",
    icon: (color) => <MaterialCommunityIcons name="weight-lifter" size={28} color={color} />,
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
  },
  {
    feature: "athlete_tracker",
    label: "Mi Entrenamiento",
    description: "Seguimiento de tu plan y entrenamientos del día.",
    href: "/(drawer)/athlete-tracker",
    icon: (color) => <FontAwesome5 name="running" size={24} color={color} />,
    roles: ["MEMBER"],
  },
  {
    feature: null,
    label: "Configuración",
    description: "Miembros, branding y ajustes del cliente.",
    href: "/(drawer)/client-settings",
    icon: (color) => <Feather name="sliders" size={24} color={color} />,
    roles: ["OWNER", "ADMIN"],
  },
];

export default function DashboardScreen() {
  const c = useColors();
  const router = useRouter();
  const { user, hasAnyRole } = useAuth();
  const { hasFeature, branding, features } = useClientStore();

  const isSystemAdmin = user?.role === "SYSTEM_ADMIN";

  const visibleCards = FEATURE_CARDS.filter((card) => {
    if (!hasAnyRole(card.roles as Parameters<typeof hasAnyRole>[0])) return false;
    if (card.feature && !isSystemAdmin && !hasFeature(card.feature)) return false;
    return true;
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  })();

  return (
    <MainLayout scrollable padding={false}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: c.textMuted }]}>{greeting},</Text>
          <Text style={[styles.name, { color: c.text }]}>{user?.name ?? branding.orgName}</Text>
          {features.length > 0 && (
            <Text style={[styles.subtitle, { color: c.textMuted }]}>
              {features.length} {features.length === 1 ? "servicio activo" : "servicios activos"}
            </Text>
          )}
        </View>

        {/* Feature cards */}
        <View style={styles.grid}>
          {visibleCards.map((card) => (
            <TouchableOpacity
              key={card.href}
              style={[styles.card, { backgroundColor: c.backgroundStrong, borderColor: c.border }]}
              onPress={() => router.push(card.href as Parameters<typeof router.push>[0])}
              activeOpacity={0.75}
            >
              <View style={[styles.iconBox, { backgroundColor: c.primary + "18" }]}>
                {card.icon(c.primary)}
              </View>
              <Text style={[styles.cardLabel, { color: c.text }]}>{card.label}</Text>
              <Text style={[styles.cardDesc, { color: c.textMuted }]} numberOfLines={2}>
                {card.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.md, gap: SPACING.lg, flexGrow: 1 },
  header: { gap: 2, paddingTop: SPACING.sm },
  greeting: { fontSize: TYPOGRAPHY.fontSize.sm },
  name: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.xs, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  card: {
    width: "47%",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  cardLabel: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: "700" },
  cardDesc: { fontSize: TYPOGRAPHY.fontSize.xs, lineHeight: 16 },
});
