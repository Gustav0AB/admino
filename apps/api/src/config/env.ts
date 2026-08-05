const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3001",
  "https://frontend-staging-24fc.up.railway.app",
];

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "3000", 10),
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwt: {
    secret: process.env.JWT_SECRET ?? "dev-secret",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
  },
  cors: {
    allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? process.env.CORS_ORIGIN ?? defaultAllowedOrigins.join(","))
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  },
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "no-reply@admino.app",
  },
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
} as const;
