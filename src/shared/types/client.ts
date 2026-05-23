export type ClientBranding = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  orgName: string;
  logoUrl: string | null;
};

export type ClientFeature =
  | "payments"
  | "training_planning"
  | "tracker"
  | "patients"
  | "log_access"
  | "nutritionist_planning"
  | "checkin"
  | "events"
  | "analytics"
  | "injuries";
