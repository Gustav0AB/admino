import type { Athlete, PaginatedResponse } from "@/shared/types/api";

export const mockGetAthletes: PaginatedResponse<Athlete> = {
  status: 200,
  message: "OK",
  data: {
    total: 5,
    page: 1,
    pageSize: 20,
    items: [
      {
        id: "athlete-1",
        name: "John Athlete",
        email: "john@demo.com",
        orgId: "org-demo-1",
        status: "active",
        joinedAt: "2024-01-15T08:00:00Z",
      },
      {
        id: "athlete-2",
        name: "Maria Runner",
        email: "maria@demo.com",
        orgId: "org-demo-1",
        status: "active",
        joinedAt: "2024-02-10T08:00:00Z",
      },
      {
        id: "athlete-3",
        name: "Carlos Swim",
        email: "carlos@demo.com",
        orgId: "org-demo-1",
        status: "active",
        joinedAt: "2024-03-05T08:00:00Z",
      },
      {
        id: "athlete-4",
        name: "Sara Lift",
        email: "sara@demo.com",
        orgId: "org-demo-1",
        status: "inactive",
        joinedAt: "2023-11-20T08:00:00Z",
      },
      {
        id: "athlete-5",
        name: "Luca Sprint",
        email: "luca@demo.com",
        orgId: "org-demo-1",
        status: "active",
        joinedAt: "2024-04-01T08:00:00Z",
      },
    ],
  },
};
