import { type ReactNode } from "react";
import { View, useWindowDimensions, type ViewProps } from "react-native";

type ResponsiveContainerProps = ViewProps & {
  children: ReactNode;
};

export function ResponsiveContainer({ children, style, ...props }: ResponsiveContainerProps) {
  const { width } = useWindowDimensions();
  const isLarge = width >= 640;

  return (
    <View
      style={[
        {
          flex: 1,
          width: "100%",
          paddingHorizontal: isLarge ? 32 : 16,
          ...(isLarge ? { maxWidth: 1200, alignSelf: "center" } : {}),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
