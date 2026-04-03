import { type ReactNode } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useColors } from "@/shared/hooks/useColors";
import { H2 } from "@/shared/components/typography/Label";
import { componentStyles, commonStyles } from "@/shared/theme/styles";
import {
  BORDER_RADIUS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
} from "@/shared/theme/tokens";

type ModalSize = "sm" | "md" | "lg" | "xl";

type CustomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  trigger?: ReactNode;
  size?: ModalSize;
  closable?: boolean;
};

export function CustomModal({
  open,
  onOpenChange,
  title,
  children,
  footer,
  trigger,
  size = "md",
  closable = true,
}: CustomModalProps) {
  const c = useColors();

  const sizeStyles = {
    sm: { maxWidth: 400 },
    md: { maxWidth: 500 },
    lg: { maxWidth: 600 },
    xl: { maxWidth: 800 },
  };

  return (
    <>
      {trigger}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => closable && onOpenChange(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={commonStyles.flex1}
        >
          <TouchableWithoutFeedback
            onPress={() => closable && onOpenChange(false)}
          >
            <View style={componentStyles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.centeredWrapper} pointerEvents="box-none">
            <View
              style={[
                componentStyles.modalContent,
                sizeStyles[size],
                {
                  backgroundColor: c.background,
                  borderColor: c.border,
                  ...SHADOWS.lg,
                },
              ]}
            >
              <View
                style={[
                  commonStyles.flexRow,
                  commonStyles.justifyBetween,
                  commonStyles.alignCenter,
                ]}
              >
                <H2 style={{ flex: 1 }}>{title}</H2>
                {closable && (
                  <TouchableOpacity
                    onPress={() => onOpenChange(false)}
                    style={styles.closeButton}
                    accessibilityLabel="Close modal"
                    accessibilityRole="button"
                    hitSlop={{
                      top: SPACING.sm,
                      bottom: SPACING.sm,
                      left: SPACING.sm,
                      right: SPACING.sm,
                    }}
                  >
                    <Text
                      style={[
                        styles.closeIcon,
                        {
                          color: c.textMuted,
                          fontSize: TYPOGRAPHY.fontSize.lg,
                          fontWeight: TYPOGRAPHY.fontWeight.bold,
                        },
                      ]}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ gap: SPACING.md }}>{children}</View>
              {footer && (
                <View
                  style={[
                    commonStyles.flexRow,
                    commonStyles.justifyBetween,
                    styles.footer,
                  ]}
                >
                  {footer}
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  centeredWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.full,
    ...Platform.select({
      web: {
        cursor: "pointer",
        ":hover": {
          backgroundColor: "rgba(0, 0, 0, 0.1)",
        },
      },
    }),
  },
  closeIcon: {
    ...Platform.select({
      web: {
        userSelect: "none",
      },
    }),
  },
  footer: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
});
