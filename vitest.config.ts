import path from "node:path";
import { defineConfig } from "vitest/config";

const root = path.resolve(__dirname);

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(root, "apps/api/src"),
      "@lib": path.resolve(root, "apps/api/src/lib"),
      "@middleware": path.resolve(root, "apps/api/src/middleware"),
      "@config": path.resolve(root, "apps/api/src/config"),
      "@features": path.resolve(root, "apps/web/src/features"),
      "@shared": path.resolve(root, "apps/web/src/shared"),
      express: path.resolve(root, "apps/api/node_modules/express"),
      zod: path.resolve(root, "apps/api/node_modules/zod"),
      jsonwebtoken: path.resolve(root, "apps/api/node_modules/jsonwebtoken"),
      "@prisma/client": path.resolve(root, "apps/api/node_modules/@prisma/client"),
      "@prisma/adapter-pg": path.resolve(root, "apps/api/node_modules/@prisma/adapter-pg"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "apps/api/src/middleware/{auth,error,response}.ts",
        "apps/api/src/lib/{base-service,generic-router}.ts",
        "apps/web/src/features/athlete-tracker/parseWorkout.ts",
        "apps/web/src/features/athlete-dashboard/calendar/PlanCalendar/calendarUtils.ts",
        "apps/web/src/features/expenses/helpers.ts",
      ],
      thresholds: { lines: 80, functions: 80, branches: 60, statements: 80 },
    },
  },
});
