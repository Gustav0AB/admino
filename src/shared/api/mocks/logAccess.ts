import type { ApiResponse, CheckIn, PaginatedResponse } from "@/shared/types/api";

export const mockCheckIn: ApiResponse<CheckIn> = {
  status: 200,
  message: "OK",
  data: {
    id: "checkin-mock-1",
    userId: "user-client-1",
    userName: "Demo Client",
    userEmail: "client@demo.com",
    orgId: "org-demo-1",
    checkedInAt: new Date().toISOString(),
  },
};

export const mockGetCheckIns: PaginatedResponse<CheckIn> = {
  status: 200,
  message: "OK",
  data: {
    total: 4,
    page: 1,
    pageSize: 20,
    items: [
      {
        id: "checkin-1",
        userId: "user-1",
        userName: "John Athlete",
        userEmail: "john@demo.com",
        orgId: "org-demo-1",
        checkedInAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: "checkin-2",
        userId: "user-2",
        userName: "Maria Runner",
        userEmail: "maria@demo.com",
        orgId: "org-demo-1",
        checkedInAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      },
      {
        id: "checkin-3",
        userId: "user-3",
        userName: "Carlos Swim",
        userEmail: "carlos@demo.com",
        orgId: "org-demo-1",
        checkedInAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
      },
      {
        id: "checkin-4",
        userId: "user-4",
        userName: "Sara Lift",
        userEmail: "sara@demo.com",
        orgId: "org-demo-1",
        checkedInAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      },
    ],
  },
};
