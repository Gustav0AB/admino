import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from "@tanstack/react-query";
import { apiService } from "@/shared/api/apiService";
import type { RequestOptions } from "@/shared/api/client";

export function useApiQuery<T>(
  queryKey: QueryKey,
  endpoint: string,
  mockData: T,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">
) {
  return useQuery<T>({
    queryKey,
    queryFn: () => apiService<T>(endpoint, mockData),
    ...options,
  });
}

export function useApiMutation<TData, TVariables>(
  endpoint: string,
  mockData: TData,
  requestOptions?: Omit<RequestOptions, "body">,
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) =>
      apiService<TData>(endpoint, mockData, {
        method: requestOptions?.method ?? "POST",
        body: variables,
        headers: requestOptions?.headers,
      }),
    ...options,
  });
}
