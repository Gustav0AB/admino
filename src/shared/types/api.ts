export type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
};

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}>;

export type Athlete = {
  id: string;
  name: string;
  email: string;
  orgId: string;
  status: "active" | "inactive";
  joinedAt: string;
};

export type Plan = {
  id: string;
  name: string;
  description: string;
  orgId: string;
  status: "active" | "draft" | "archived";
  createdAt: string;
  athleteCount: number;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}
