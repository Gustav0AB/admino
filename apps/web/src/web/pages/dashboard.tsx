import { Link } from "react-router-dom";
import { Card } from "@/shared/ui";
import { useAuth } from "@/shared/hooks/useAuth";
import { useClientStore } from "@/shared/store/clientStore";
import type { ClientFeature } from "@/shared/types/client";
import { routes } from "@/web/routes";

type FeatureCard = {
  feature: ClientFeature | null;
  label: string;
  description: string;
  href: string;
  roles: string[];
};

const FEATURE_CARDS: FeatureCard[] = [
  {
    feature: "finanzas",
    label: "Finanzas",
    description: "Gestiona ingresos, egresos y balances.",
    href: routes.expenses,
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
  },
  {
    feature: "athlete_dashboard",
    label: "Planes de atletas",
    description: "Atletas, planes de entrenamiento y calendario.",
    href: routes.athleteDashboard,
    roles: ["SYSTEM_ADMIN", "OWNER", "ADMIN"],
  },
  {
    feature: "athlete_tracker",
    label: "Mi Entrenamiento",
    description: "Seguimiento de tu plan y entrenamientos del día.",
    href: routes.athleteTracker,
    roles: ["MEMBER"],
  },
  {
    feature: null,
    label: "Configuración",
    description: "Miembros, branding y ajustes del cliente.",
    href: routes.clientSettings,
    roles: ["OWNER", "ADMIN"],
  },
];

export default function DashboardPage() {
  const { user, hasAnyRole } = useAuth();
  const { hasFeature, branding } = useClientStore();
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
        <h1 className="page-title">{greeting}, {user?.name ?? branding.orgName}</h1>
      </header>

      <section className="feature-grid">
        {visibleCards.map((card) => (
          <Link key={card.href} className="feature-card-button" to={card.href}>
            <Card>
              <h2 className="feature-title">{card.label}</h2>
              <p className="feature-description">{card.description}</p>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
