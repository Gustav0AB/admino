import { type ReactNode } from "react";

type DynamicThemeProviderProps = {
  children: ReactNode;
};

export function DynamicThemeProvider({ children }: DynamicThemeProviderProps) {
  return <>{children}</>;
}
