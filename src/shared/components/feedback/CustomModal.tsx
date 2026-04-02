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
import { H2 } from "@/shared/components/typography/CustomText";

type CustomModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  trigger?: ReactNode;
};

export function CustomModal({ open, onOpenChange, title, children, footer, trigger }: CustomModalProps) {
  const c = useColors();

  return (
    <>
      {trigger}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => onOpenChange(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={() => onOpenChange(false)}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
          <View style={styles.centeredWrapper} pointerEvents="box-none">
            <View style={[styles.dialog, { backgroundColor: c.background, borderColor: c.border }]}>
              <View style={styles.titleRow}>
                <H2 style={{ flex: 1 }}>{title}</H2>
                <TouchableOpacity
                  onPress={() => onOpenChange(false)}
                  style={styles.closeButton}
                  accessibilityLabel="Close modal"
                  accessibilityRole="button"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.closeIcon, { color: c.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={{ gap: 12 }}>{children}</View>
              {footer && <View style={styles.footer}>{footer}</View>}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  centeredWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  dialog: {
    width: "100%",
    maxWidth: 560,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 4,
  },
});
