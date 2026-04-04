import { Platform, View, type ViewStyle } from "react-native";
import { Z_INDEX } from "@/shared/theme/tokens";
import type { ReactNode } from "react";

type StickyWrapperProps = {
  children: ReactNode;
  /** z-index applied on all platforms. Defaults to Z_INDEX.sticky (1020) */
  zIndex?: number;
  style?: ViewStyle;
};

/**
 * Wraps content so it sticks to the top of the viewport on web
 * (`position: sticky`) and sits above scrollable content on native
 * (achieved structurally — this wrapper lives outside the ScrollView).
 */
export function StickyWrapper({
  children,
  zIndex = Z_INDEX.sticky,
  style,
}: StickyWrapperProps) {
  return (
    <View
      style={[
        Platform.select<ViewStyle>({
          web: {
            // @ts-expect-error — RN Web accepts CSS position values
            position: "sticky",
            top: 0,
            zIndex,
          },
          default: { zIndex },
        }),
        style,
      ]}
    >
      {children}
    </View>
  );
}
