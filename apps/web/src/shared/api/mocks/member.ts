import type { OrgMember } from "@/shared/types/member";

export const mockOrgMembers: OrgMember[] = [
  {
    id: "mem-1",
    name: "Sam Coach",
    username: "sam_coach",
    email: null,
    role: "OWNER",
    isActive: true,
    permissions: [],
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "mem-2",
    name: "Ana Trainer",
    username: "ana_trainer",
    email: null,
    role: "ADMIN",
    isActive: true,
    permissions: ["finanzas", "athlete_dashboard"],
    createdAt: "2024-02-10T08:00:00Z",
  },
  {
    id: "mem-3",
    name: "Luis Helper",
    username: "luis_helper",
    email: null,
    role: "MEMBER",
    isActive: false,
    permissions: ["athlete_tracker"],
    createdAt: "2024-03-05T08:00:00Z",
  },
];
