import { type ReactNode } from "react";
import { View, useWindowDimensions } from "react-native";
import { useColors } from "@/shared/hooks/useColors";

const SIDEBAR_BREAKPOINT = 1020;
const SIDEBAR_WIDTH = 260;

type AdaptiveLayoutProps = {
  children: ReactNode;
  sidebar?: ReactNode;
};

export function AdaptiveLayout({ children, sidebar }: AdaptiveLayoutProps) {
  const { width } = useWindowDimensions();
  const c = useColors();
  const isPermanentSidebar = width >= SIDEBAR_BREAKPOINT;

  if (isPermanentSidebar && sidebar) {
    return (
      <View style={{ flex: 1, flexDirection: "row" }}>
        <View
          style={{
            width: SIDEBAR_WIDTH,
            backgroundColor: c.backgroundStrong,
            borderRightWidth: 1,
            borderRightColor: c.border,
          }}
        >
          {sidebar}
        </View>
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    );
  }

  return <View style={{ flex: 1 }}>{children}</View>;
}

export function useIsPermanentSidebar(): boolean {
  const { width } = useWindowDimensions();
  return width >= SIDEBAR_BREAKPOINT;
}
