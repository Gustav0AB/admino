import { useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

/**
 * Syncs a single URL search-param key with component state.
 * Drop-in replacement for useState when you need bookmarkable views.
 *
 * @param key          - The URL search-param key (e.g. "view")
 * @param defaultValue - Fallback when the param is absent
 * @returns            [currentValue, setter]  — same shape as useState
 */
export function useUrlState(
  key: string,
  defaultValue: string
): [string, (value: string) => void] {
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const router = useRouter();

  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : (raw ?? defaultValue);

  const setValue = useCallback(
    (newValue: string) => {
      router.setParams({ [key]: newValue });
    },
    [key, router]
  );

  return [value, setValue];
}
