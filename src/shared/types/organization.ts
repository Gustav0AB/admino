export type OrgBranding = {
  primaryColor: string;
  secondaryColor: string;
  orgName: string;
  logoUrl: string | null;
};

export type OrgFeature =
  | "payments"
  | "training_planning"
  | "tracker"
  | "patients"
  | "log_access"
  | "nutritionist_planning";
