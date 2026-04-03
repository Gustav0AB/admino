import { ReactNode } from "react";
import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/shared/hooks/useColors";

type MainLayoutProps = {
  children: ReactNode;
  scrollable?: boolean;
  padding?: boolean;
};

export function MainLayout({
  children,
  scrollable = false,
  padding = true,
}: MainLayoutProps) {
  const insets = useSafeAreaInsets();
  const c = useColors();

  if (scrollable) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 16,
          padding: padding ? 16 : 0,
          minHeight: "100%",
          flexGrow: 1,
          width: "100%",
        }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.background,
        padding: padding ? 16 : 0,
        paddingBottom: (padding ? 16 : 0) + insets.bottom,
      }}
    >
      {children}
    </View>
  );
}
