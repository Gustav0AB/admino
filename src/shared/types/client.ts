export type ClientBranding = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  orgName: string;
  logoUrl: string | null;
};

export type ClientFeature =
  | "athlete_dashboard"
  | "athlete_tracker"
  | "finanzas"
  | "events"
  | "analytics"
  | "injuries"
  // not yet ready — kept for future
  | "payments"
  | "patients"
  | "log_access"
  | "nutritionist_planning";
