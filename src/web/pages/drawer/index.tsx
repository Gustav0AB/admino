import { Card } from "@generic/components";
import { useAuth } from "@/shared/hooks/useAuth";
import { useClientStore } from "@/shared/store/clientStore";
import { navigate } from "@/web/navigation";
import type { ClientFeature } from "@/shared/types/client";

type FeatureCard = {
  feature: ClientFeature | null;
  label: string;
  description: string;
  href: string;
  icon: string;
  roles: string[];
};

const FEATURE_CARDS: FeatureCard[] = [
  {
    feature: "finanzas",
    label: "Finanzas",
    description: "Gestiona ingresos, egresos y balances.",
    href: "/(drawer)/expenses",
    icon: "$",
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
  },
  {
    feature: "athlete_dashboard",
    label: "Athlete Dashboard",
    description: "Atletas, planes de entrenamiento y calendario.",
    href: "/(drawer)/athlete-dashboard",
    icon: "🏋️",
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
  },
  {
    feature: "athlete_tracker",
    label: "Mi Entrenamiento",
    description: "Seguimiento de tu plan y entrenamientos del día.",
    href: "/(drawer)/athlete-tracker",
    icon: "🏃",
    roles: ["MEMBER"],
  },
  {
    feature: null,
    label: "Configuración",
    description: "Miembros, branding y ajustes del cliente.",
    href: "/(drawer)/client-settings",
    icon: "⚙",
    roles: ["OWNER", "ADMIN"],
  },
];

export default function DashboardScreen() {
  const { user, hasAnyRole } = useAuth();
  const { hasFeature, branding, features } = useClientStore();
  const isSystemAdmin = user?.role === "SYSTEM_ADMIN";

  const visibleCards = FEATURE_CARDS.filter((card) => {
    if (!hasAnyRole(card.roles as Parameters<typeof hasAnyRole>[0])) return false;
    if (card.feature && !isSystemAdmin && !hasFeature(card.feature)) return false;
    return true;
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">{greeting},</p>
        <h1 className="page-title">
          {user?.name ?? branding.orgName}
        </h1>
        {features.length > 0 && (
          <p className="page-meta">
            {features.length} {features.length === 1 ? "servicio activo" : "servicios activos"}
          </p>
        )}
      </header>

      <section className="feature-grid">
        {visibleCards.map((card) => (
          <button key={card.href} className="feature-card-button" onClick={() => navigate(card.href)}>
            <Card>
              <div className="feature-icon">
                {card.icon}
              </div>
              <h2 className="feature-title">{card.label}</h2>
              <p className="feature-description">{card.description}</p>
            </Card>
          </button>
        ))}
      </section>
    </div>
  );
}
