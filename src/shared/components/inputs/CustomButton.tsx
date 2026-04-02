import { TouchableOpacity, Text, StyleSheet, type TouchableOpacityProps } from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { useOrgTheme } from "@/shared/theme/useOrgTheme";

type ButtonVariant = "primary" | "secondary" | "outline";

type CustomButtonProps = TouchableOpacityProps & {
  variant?: ButtonVariant;
  children?: React.ReactNode;
};

export function CustomButton({ variant = "primary", children, style, disabled, ...props }: CustomButtonProps) {
  const c = useColors();
  const { primaryColor, secondaryColor } = useOrgTheme();

  const variantStyles = {
    primary: { backgroundColor: primaryColor, borderWidth: 0 },
    secondary: { backgroundColor: secondaryColor, borderWidth: 0 },
    outline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: primaryColor },
  };

  const textColor = {
    primary: "#FFFFFF",
    secondary: "#FFFFFF",
    outline: primaryColor,
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyles[variant],
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.85}
      disabled={disabled}
      accessibilityRole="button"
      {...props}
    >
      <Text style={[styles.label, { color: textColor[variant] }]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});
