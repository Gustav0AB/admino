export type ClientBranding = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  orgName: string;
  slug: string;
  logoUrl: string | null;
};

export type ClientFeature =
  | "athlete_dashboard"
  | "athlete_tracker"
  | "finanzas";
