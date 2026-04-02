const en = {
  entities: {
    client: "Athlete",
    client_plural: "Athletes",
  },
  auth: {
    signIn: "Sign In",
    signOut: "Sign Out",
    email: "Email",
    password: "Password",
  },
  planning: {
    title: "Planning",
    newSession: "New Session",
    session: "Session",
    session_plural: "Sessions",
  },
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    loading: "Loading...",
    error: "Something went wrong",
  },
} as const;

export type TranslationKeys = typeof en;
export default en;
