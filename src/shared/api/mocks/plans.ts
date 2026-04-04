import type { Plan, PaginatedResponse } from "@/shared/types/api";

export const mockGetPlans: PaginatedResponse<Plan> = {
  status: 200,
  message: "OK",
  data: {
    total: 4,
    page: 1,
    pageSize: 20,
    items: [
      {
        id: "plan-1",
        name: "Base Endurance Block",
        description: "12-week aerobic base building for competitive athletes.",
        orgId: "org-demo-1",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        athleteCount: 3,
      },
      {
        id: "plan-2",
        name: "Strength Phase I",
        description: "8-week progressive overload program targeting compound lifts.",
        orgId: "org-demo-1",
        status: "active",
        createdAt: "2024-02-15T00:00:00Z",
        athleteCount: 5,
      },
      {
        id: "plan-3",
        name: "Sprint Development",
        description: "6-week speed and power development cycle.",
        orgId: "org-demo-1",
        status: "draft",
        createdAt: "2024-03-10T00:00:00Z",
        athleteCount: 0,
      },
      {
        id: "plan-4",
        name: "Off-Season Recovery",
        description: "Low-intensity maintenance program for the off-season.",
        orgId: "org-demo-1",
        status: "archived",
        createdAt: "2023-11-01T00:00:00Z",
        athleteCount: 2,
      },
    ],
  },
};
